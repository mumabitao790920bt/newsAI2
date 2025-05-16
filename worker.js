export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 处理静态资产
    if (url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request);
    }
    
    // 处理所有其他请求
    try {
      const page = await env.ASSETS.fetch(request);
      if (page.status === 404) {
        // 如果页面不存在，返回 index.html
        return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
      }
      return page;
    } catch (e) {
      return new Response('Internal Error', { status: 500 });
    }
  }
};