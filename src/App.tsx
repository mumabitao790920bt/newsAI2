import React from "react";
import "./index.css";

// 在 NewsItem 接口中添加 news_from 字段
interface NewsItem {
  id: string;
  title: string;
  mobile_url: string;
  pc_url: string;
  pub_date: string;
  real_pub_date: string;
  collect_time: string;
  news_from: string;
  news_from_id: string;
  news_pingfen: number;
  news_pingfen_liyou: string;
  news_summary: string;
  market_analysis: string;
  no_net_pngfen: number;
  no_net_pingfen_liyou: string;
  // UI 相关的额外字段
  rel_time?: string;
  score?: number;
  showAnalysis?: boolean;
}

// API URL（使用 ainews.xin 的子域名）
const API_BASE = "https://api.ainews.xin";

function App() {
  const [newsList, setNewsList] = React.useState<NewsItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'timeline' | 'important' | 'daily-important'>('timeline');

  const formatDateTime = (dateStr: string) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const getTimeAgo = (realPubDate: string) => {
      if (!realPubDate) return '';

      try {
        const now = new Date();
        const pubDate = new Date(realPubDate);

        if (isNaN(pubDate.getTime())) {
          return '';
        }

        const diffMinutes = Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60));

        if (diffMinutes < 1) return '刚刚';
        if (diffMinutes < 60) return `${diffMinutes}分钟前`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`;
        return `${Math.floor(diffMinutes / 1440)}天前`;
      } catch (error) {
        console.error('日期转换错误:', error);
        return '';
      }
    };

    // 数据获取函数，现在它读取当前的 viewMode 和 page 状态
    const fetchNews = React.useCallback(() => {
      setLoading(true);

      // 使用完整的 Worker API URL，添加类型参数和页码大小
      let apiUrl = `${API_BASE}/api/news?page=${page}`; // 使用 state 中的 page
      let current_pageSize = 20; // 默认每页20条

      if (viewMode === 'important') {
        apiUrl += `&type=important`;
      } else if (viewMode === 'daily-important') {
        apiUrl += `&type=daily_important`;
        current_pageSize = 6; // 当日重要新闻每页6条
      }

      apiUrl += `&pageSize=${current_pageSize}`;

      fetch(apiUrl)
        .then(res => res.json())
        .then((response) => {
          if (!response.success) {
            throw new Error(response.error || '获取新闻失败');
          }

          const newsData = response.data;

          const processNews = (news: NewsItem) => {
            const dateStr = news.real_pub_date || news.pub_date;
            const date = new Date(dateStr);

            // 转换为本地时间字符串
            const localTime = date.toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/\//g, '-');

            const timeAgo = getTimeAgo(dateStr);

            return {
              ...news,
              rel_time: `${timeAgo}/${localTime}`,
              score: news.news_pingfen || 0,
              pc_url: news.pc_url || '#',
              market_analysis: news.market_analysis || '',
              news_from: news.news_from || '未知来源'
            };
          };

          // 前端保留评分过滤作为补充
          const filteredData = viewMode === 'important'
            ? newsData.filter((news: NewsItem) => news.news_pingfen >= 70)
            : viewMode === 'daily-important'
            ? newsData.filter((news: NewsItem) => news.news_pingfen >= 80)
            : newsData;

          if (page === 1) { // 如果是第一页，替换列表
            setNewsList(filteredData.map(processNews));
          } else { // 否则追加到列表
            setNewsList(prev => [...prev, ...filteredData.map(processNews)]);
          }

          // 根据当前模式和返回的数据量判断是否有更多数据
          setHasMore(filteredData.length === current_pageSize);
          setLoading(false);
        })
        .catch(error => {
          console.error('获取新闻失败:', error);
          setLoading(false);
          setHasMore(false);
        });
    }, [viewMode, page]); // fetchNews 现在依赖 viewMode 和 page

    // 使用 useEffect 来监听 viewMode 和 page 的变化，并触发数据加载
    React.useEffect(() => {
      // 当 viewMode 或 page 变化时调用 fetchNews
      // page=1 的情况会在 viewMode 变化时触发（因为按钮点击会 setPage(1)）
      fetchNews();
    }, [viewMode, page, fetchNews]); // 依赖 viewMode, page, 和 fetchNews

    const handleRefresh = React.useCallback(() => {
      // 只需要重置页码为 1
      setPage(1);
      // 数据加载将由上面的 useEffect 触发
    }, []);

    const loadMore = React.useCallback(() => {
      // 只需要增加页码
      setPage(prevPage => prevPage + 1);
      // 数据加载将由上面的 useEffect 触发
    }, []);

    const toggleAnalysis = React.useCallback((id: string) => {
      setNewsList(list =>
        list.map(news =>
          news.id === id
            ? { ...news, showAnalysis: !news.showAnalysis }
            : news
        )
      );
    }, []);

    // 处理视图模式切换
    const handleViewModeChange = React.useCallback((mode: 'timeline' | 'important' | 'daily-important') => {
      // 更新 viewMode 和重置 page 为 1
      setViewMode(mode);
      setPage(1);
      // 数据加载将由 useEffect 触发
    }, []);


    return (
      <div className="min-h-screen w-full flex flex-col items-center bg-transparent">
        {/* 添加顶部菜单 */}
        <div className="w-full max-w-[600px] flex justify-center gap-4 mt-8">
          <button
            onClick={() => handleViewModeChange('timeline')}
            className={`px-6 py-2 rounded-full transition-colors ${
              viewMode === 'timeline'
                ? 'bg-[#4870ae] text-white'
                : 'bg-[#3c5476]/50 text-gray-300 hover:bg-[#3c5476]/70'
            }`}
          >
            按时间线新闻速递
          </button>
          <button
            onClick={() => handleViewModeChange('important')}
            className={`px-6 py-2 rounded-full transition-colors ${
              viewMode === 'important'
                ? 'bg-[#4870ae] text-white'
                : 'bg-[#3c5476]/50 text-gray-300 hover:bg-[#3c5476]/70'
            }`}
          >
            重要新闻排序速递
          </button>
          {/* 新增当日重要新闻按钮 */}
          <button
            onClick={() => handleViewModeChange('daily-important')}
            className={`px-6 py-2 rounded-full transition-colors ${
              viewMode === 'daily-important'
                ? 'bg-[#4870ae] text-white'
                : 'bg-[#3c5476]/50 text-gray-300 hover:bg-[#3c5476]/70'
            }`}
          >
            当日重要新闻
          </button>
        </div>

        <main className="flex-1 w-full flex flex-col items-center">
          <section
            className={`mt-16 w-full max-w-[600px] flex flex-col rounded-2xl shadow-xl ${
              viewMode === 'timeline'
                ? 'bg-[#3c5476]/90'
                : viewMode === 'important' ? 'bg-[#4c3c76]/90' : 'bg-[#604090]/90' // 当日重要新闻使用不同颜色
            }`}
            style={{
              border: viewMode === 'timeline'
                ? '4px solid #46638c'
                : viewMode === 'important' ? '4px solid #5c468c' : '4px solid #7050a0', // 边框颜色
              boxShadow:'0 6px 32px 0 rgba(60,84,118,.16)'
            }}
          >
            <div className={`flex items-center justify-between px-4 pt-3 pb-2 rounded-t-2xl border-b ${
              viewMode === 'timeline'
                ? 'bg-[#4870ae]/70 border-[#46638c]/70'
                : viewMode === 'important' ? 'bg-[#6848ae]/70 border-[#5c468c]/70' : 'bg-[#8050b0]/70 border-[#7050a0]/70'
            }`}>
              <div className="flex items-center">
                <img alt="新闻时间线速递" src="https://ext.same-assets.com/1849582332/3218743151.png" className="w-8 h-8 rounded-full bg-white shadow mr-2"/>
                <div className="text-white font-bold text-xl tracking-wide">
                  {viewMode === 'timeline' ? '新闻时间线速递' : viewMode === 'important' ? '重要新闻速递' : '当日重要新闻'}
                </div>
                <div className="ml-3 bg-blue-100/60 text-blue-800 px-2 py-0.5 text-xs rounded">
                  AI专业解读：让每个人都读懂新闻背后的影响
                </div>
              </div>

              {/* 描述文本 */}
              <div className="text-xs text-white/70 px-5 pt-2 pb-1">
                {viewMode === 'timeline'
                  ? ''
                  : viewMode === 'important' ? '' : ''}
              </div>
              <div className="flex items-center gap-4 text-gray-300/70 text-lg">
                <button
                  onClick={handleRefresh}
                  title="刷新"
                  className="hover:bg-blue-200/40 rounded p-1"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4v5h5M19.3 5.7A9 9 0 1 0 21 12"/>
                  </svg>
                </button>
                <button title="收藏" className="hover:bg-blue-200/40 rounded p-1"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 17.75L6.16 21l1.12-6.52L2 9.76l6.57-.95L12 3.5l3.43 5.31 6.57.95-4.77 4.72 1.12 6.52z"/></svg></button>
                <button title="更多" className="hover:bg-blue-200/40 rounded p-1"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/><circle cx="4" cy="12" r="1.5"/></svg></button>
              </div>
            </div>
            <div className="text-xs text-white/70 px-5 pt-2 pb-1">
              华尔街见闻为您带来最新国际及财经领域快讯。
            </div>
            <div className="relative rounded-b-2xl bg-[#2e3951] mt-0 pb-2 pt-2 px-2 flex flex-col gap-0 w-full" style={{overflow: "visible"}}>
              {loading && page === 1 ? (
                <div className="text-white text-center py-4">加载中...</div>
              ) : (
                <>
                  <div style={{position:'absolute', top:0, bottom:0, left:26, width:0, zIndex:0}} aria-hidden="true">
                    <div style={{width:2, height:"100%", background:'#515e7c', opacity:0.32, borderRadius:2, marginLeft:1}}></div>
                  </div>
                  {newsList.map((news, idx) => (
                    <div key={news.id} className="w-full px-2 py-1 relative flex flex-col">
                      <div className="flex items-center w-full">
                        <div className="flex-col items-center mr-2" style={{width:18}}>
                          <div style={{height: idx===0 ? 20 : 8, width:2, background:'#515e7c', opacity:0.32, borderRadius:2}} />
                          <div style={{ height:2, width:14, background:'#8ea1c8', borderRadius:1, marginTop:0, marginBottom:0 }} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-blue-200/80 font-sans">{news.rel_time}</span>
                          <span className="text-xs text-gray-400/80">&nbsp;·&nbsp;{news.news_from}</span>
                        </div>
                      </div>

                      {/* 新增：重要性评分和AI解读按钮的行 */}
                      <div className="flex items-center mt-1">
                        <div className="mr-2" style={{width:18}} />
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="text-xs text-pink-200 whitespace-nowrap">
                            重要性评分：{news.score}
                            {news.score === 0 && (
                              <span className="text-gray-400 ml-1">（AI解读分析正在进行，请稍后刷新查看）</span>
                            )}
                          </span>
                          <button
                            onClick={() => toggleAnalysis(news.id)}
                            className={`px-2 py-1 rounded transition text-white text-xs shadow ${
                              news.showAnalysis ? 'bg-blue-600' : 'bg-rose-600'
                            }`}
                            style={{ minWidth: '70px', fontSize:'12px' }}
                          >
                            AI解读
                          </button>
                        </div>
                      </div>

                      <div className="flex">
                        <div className="mr-2" style={{width:18}} />
                        <a
                          href={news.pc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white text-base whitespace-pre-line break-words font-[500] leading-relaxed flex-1 pr-2 py-0.5 hover:text-blue-300 transition-colors"
                        >
                          {news.title}
                        </a>
                      </div>
                      {news.showAnalysis && (
                        <div className="flex mt-2 mb-3">
                          <div className="mr-2" style={{width:18}} />
                          <div className="flex-1 text-sm text-gray-300 bg-[#2a334d] p-3 rounded">
                            {news.market_analysis?.trim() || '暂无AI解读'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {hasMore && (loading && page > 1 ? (
                     <div className="flex justify-center py-4"><div className="text-white">加载中...</div></div>
                  ) : hasMore ? (
                    <div className="flex justify-center py-4">
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className="px-4 py-2 bg-[#4870ae]/70 text-white rounded hover:bg-[#4870ae] transition-colors disabled:opacity-50"
                      >
                        加载更多
                      </button>
                    </div>
                  ) : null)}
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    );
  }

export default App;