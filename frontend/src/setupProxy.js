const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
    })
  );
  app.use(
    "/users",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
    })
  );
  app.use(
    "/admin",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
    })
  );
  app.use(
    "/uploads",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
    })
  );
  app.use(
    "/tts",
    createProxyMiddleware({
      target: "http://localhost:5000",
      changeOrigin: true,
      pathRewrite: { "^/tts": "" },
    })
  );
};
