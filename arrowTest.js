var a = 1;
var foo = {
  a: 2,
  fn: () => {
    console.log(this);
  },
};
foo.fn();
