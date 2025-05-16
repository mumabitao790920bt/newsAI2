var worker_default = {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    };

    if (!env.DB) {
      return new Response(JSON.stringify({
        success: false,
        error: "Database connection not available"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("News API is running", {
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders
        }
      });
    }

        if (url.pathname === "/api/news" && request.method === "GET") {      try {        const page = parseInt(url.searchParams.get("page") || "1");        const pageSize = 20;        const offset = (page - 1) * pageSize;        const type = url.searchParams.get("type") || "all"; // 新增参数，用于区分全部新闻和重要新闻                let query;        if (type === "important") {          query = `            SELECT * FROM news_yd             WHERE news_pingfen >= 70            ORDER BY pub_date DESC             LIMIT ? OFFSET ?          `;        } else {          query = `            SELECT * FROM news_yd             ORDER BY pub_date DESC             LIMIT ? OFFSET ?          `;        }        const { results } = await env.DB.prepare(query)          .bind(pageSize, offset)          .all();

        return new Response(JSON.stringify({
          success: true,
          data: results
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      } catch (error) {
        console.error("Database query error:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }

    if (url.pathname === "/api/sync" && request.method === "POST") {
      try {
        const newsData = await request.json();
        
        // 检查必要字段
        if (!newsData.id) {
          return new Response(JSON.stringify({
            success: false,
            error: "Missing required field: id"
          }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }

        // 插入或更新新闻数据
        await env.DB.prepare(`
          INSERT OR REPLACE INTO news_yd (
            id, title, mobile_url, pc_url, pub_date, real_pub_date,
            collect_time, news_from, news_from_id, news_pingfen,
            news_pingfen_liyou, news_summary, market_analysis,
            no_net_pngfen, no_net_pingfen_liyou
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newsData.id,  // 保持TEXT格式，不再转换为INTEGER
          newsData.title || '',
          newsData.mobile_url || '',
          newsData.pc_url || '',
          newsData.pub_date || null,
          newsData.real_pub_date || null,
          newsData.collect_time || null,
          newsData.news_from || '',
          newsData.news_from_id || '',
          parseInt(newsData.news_pingfen || '0'),
          newsData.news_pingfen_liyou || '',
          newsData.news_summary || '',
          newsData.market_analysis || '',
          parseInt(newsData.no_net_pngfen || '0'),
          newsData.no_net_pingfen_liyou || ''
        ).run();

        return new Response(JSON.stringify({
          success: true,
          message: "News synchronized successfully"
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      } catch (error) {
        console.error("Sync error:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }

    if (url.pathname.startsWith("/assets/")) {
      return env.ASSETS.fetch(request);
    }

    try {
      const page = await env.ASSETS.fetch(request);
      if (page.status === 404) {
        return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
      }
      return page;
    } catch (e) {
      return new Response("Internal Error", { status: 500 });
    }
  }
};

export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map