module.exports = {
  transpileDependencies: ["vuetify"],
  runtimeCompiler: true,
  pages: {
    index: {
      entry: "src/pages/index/main.js",
      template: "public/index.html",
      filename: "index.html",
      title: "MurtazaY@Github"
    },
    csc47200: {
      entry: "src/pages/csc47200/main.js",
      template: "public/index.html",
      filename: "csc47200.html",
      title: "CSC47200 - Computer Graphics"
    }
  }
};
