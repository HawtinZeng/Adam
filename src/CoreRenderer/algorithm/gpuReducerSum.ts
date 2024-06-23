import { TypedArray } from "src/CoreRenderer/utilsTypes";
const adapter = await navigator.gpu?.requestAdapter();
const gpuDevice = await adapter!.requestDevice()!;
export async function gpuReducerSum(sumValues: TypedArray) {
  const MaxWorkGroupSize = 256;
  if (!gpuDevice) {
    console.error("need a browser that supports WebGPU");
    return sumValues;
  }
  const module = gpuDevice.createShaderModule({
    label: "reducer1",
    code: `
  @group(0) @binding(0) var<storage,read> inputBuffer: array<u32>;
  @group(0) @binding(1) var<storage,read_write> output: atomic<u32>;
  
  // Create zero-initialized workgroup shared data
  const wgsize : u32 = 256;
  var<workgroup> sdata: array<u32, wgsize>;
  
  fn warpReduce(tid: u32) {
      sdata[tid] += sdata[tid + 32];
      sdata[tid] += sdata[tid + 16];
      sdata[tid] += sdata[tid + 8];
      sdata[tid] += sdata[tid + 4];
      sdata[tid] += sdata[tid + 2];
      sdata[tid] += sdata[tid + 1];
  }
  
  @compute @workgroup_size(wgsize)
  fn main(@builtin(workgroup_id) gid: vec3<u32>, @builtin(local_invocation_id) local_id: vec3<u32>) {
  
      // Each thread should read its data:
      var tid: u32 = local_id.x;
      // Scale the groupsize by 2 below to get the overall index:
      var idx: u32 = gid.x * wgsize * 16 + tid;
      // Add up one number from 16 workgroup size grid;
      var value: u32 = 0;
      value += inputBuffer[idx] + inputBuffer[idx + wgsize];
      value += inputBuffer[idx + 2 * wgsize] + inputBuffer[idx + 3 * wgsize];
      value += inputBuffer[idx + 4 * wgsize] + inputBuffer[idx + 5 * wgsize];
      value += inputBuffer[idx + 6 * wgsize] + inputBuffer[idx + 7 * wgsize];
      value += inputBuffer[idx + 8 * wgsize] + inputBuffer[idx + 9 * wgsize];
      value += inputBuffer[idx + 10 * wgsize] + inputBuffer[idx + 11 * wgsize];
      value += inputBuffer[idx + 12 * wgsize] + inputBuffer[idx + 13 * wgsize];
      value += inputBuffer[idx + 14 * wgsize] + inputBuffer[idx + 15 * wgsize];

      sdata[tid] = value;

      // sync all the threads:
      workgroupBarrier();
  
      // Do the reduction in shared memory:
      if tid < 128 { sdata[tid] += sdata[tid + 128]; }
      workgroupBarrier();

      if tid < 64 { sdata[tid] += sdata[tid + 64]; }
      workgroupBarrier();
  
      if tid < 32 {
          warpReduce(tid);
      }
  
      // Add result from the workgroup to the output storage:
      if tid == 0 {
          atomicAdd(&output, sdata[0]);
      }
  }
  
  `,
  });

  const pipeline = gpuDevice.createComputePipeline({
    label: "sum",
    layout: "auto",
    compute: {
      module,
    },
  });
  const outputSize = 4;
  const outputStorageBuffer = gpuDevice.createBuffer({
    label: "outputStorageBuffer",
    size: outputSize,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  });

  const num = sumValues.length / 4;
  const filteredVals = new Int32Array(num + 4 - (num % 4));
  let offset = 0;
  sumValues.forEach((val, idx) => {
    if ((idx + 1) % 4 === 0) {
      filteredVals[offset++] = val;
    }
  });

  const sumValuesBuffer = gpuDevice.createBuffer({
    label: "sum values",
    size: filteredVals.length * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  gpuDevice.queue.writeBuffer(sumValuesBuffer, 0, filteredVals);

  const resBuffer = gpuDevice.createBuffer({
    label: "resBuffer",
    size: outputStorageBuffer.size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const bindGroup = gpuDevice.createBindGroup({
    label: "sum bind group",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: sumValuesBuffer,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: outputStorageBuffer,
        },
      },
    ],
  });

  const encoder = gpuDevice.createCommandEncoder();
  const computePass = encoder.beginComputePass();

  computePass.setBindGroup(0, bindGroup);
  computePass.setPipeline(pipeline);

  computePass.dispatchWorkgroups(
    Math.ceil(sumValuesBuffer.size / MaxWorkGroupSize),
    1
  );
  computePass.end();

  encoder.copyBufferToBuffer(
    outputStorageBuffer,
    0,
    resBuffer,
    0,
    outputStorageBuffer.size
  );

  gpuDevice.queue.submit([encoder.finish()]);

  // console.time("gpuReducerSum");
  // Finally, map and read from the CPU-readable buffer.
  return resBuffer
    .mapAsync(
      GPUMapMode.READ,
      0, // Offset
      outputStorageBuffer.size // Length
    )
    .then(() => {
      const copyArrayBuffer = resBuffer.getMappedRange(
        0,
        outputStorageBuffer.size
      );

      // console.timeEnd("gpuReducerSum");
      return new Int32Array(copyArrayBuffer)[0];
    });
}

export function jsSum(sumValues: TypedArray) {
  let sum = 0;
  sumValues.forEach((val, idx) => {
    if ((idx + 1) % 4 === 0) {
      sum += sumValues[idx];
    }
  });
  return sum;
}
