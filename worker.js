export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 处理静态资产
    if (url.pathname.startsWith('/assets/')) {
      const asset = await env.ASSETS.fetch(request);
      return asset;
    }
    
    // 返回 index.html
    const response = await env.ASSETS.fetch(request);
    return response;
  }
};