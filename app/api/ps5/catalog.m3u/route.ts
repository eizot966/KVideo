import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const EXPECTED_PASSWORD = process.env.ACCESS_PASSWORD || process.env.ADMIN_PASSWORD || '13947223459';

interface VodItem {
  vod_id: number;
  vod_name: string;
  type_name?: string;
  vod_remarks?: string;
  vod_play_url?: string;
  vod_pic?: string;
}

export async function GET(request: NextRequest) {
  // 密码鉴权支持 Query 参数 ?password=xxx 或 Authorization / Cookie 头
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('password') ||
                   request.headers.get('x-access-password') ||
                   request.cookies.get('kvideo_session')?.value;

  // 如果带了密码参数且错误，则拒绝访问
  if (searchParams.has('password') && password !== EXPECTED_PASSWORD) {
    return new NextResponse('Unauthorized: Invalid password', { status: 401 });
  }

  // 获取热门片单并转换为标准 M3U
  try {
    const res = await fetch('https://cj.lziapi.com/api.php/provide/vod/from/lzm3u8?ac=videolist&pg=1', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      next: { revalidate: 3600 }
    });

    let items: VodItem[] = [];
    if (res.ok) {
      const data = await res.json();
      items = data.list || [];
    }

    let m3u = '#EXTM3U name="阿牛私人影院 - PS5专线"\n';

    for (const item of items) {
      const playUrlRaw = item.vod_play_url || '';
      if (!playUrlRaw) continue;

      // 解析播放集数，格式如：第01集$url#第02集$url
      const episodes = playUrlRaw.split('#');
      for (const ep of episodes) {
        const parts = ep.split('$');
        if (parts.length < 2) continue;
        const epTitle = parts[0].trim();
        const streamUrl = parts[1].trim();
        if (!streamUrl.startsWith('http')) continue;

        const displayName = episodes.length > 1 ? `${item.vod_name} - ${epTitle}` : item.vod_name;
        const groupTitle = item.type_name || '热门影视';
        const logo = item.vod_pic || '';

        m3u += `#EXTINF:-1 tvg-name="${displayName}" tvg-logo="${logo}" group-title="${groupTitle}",${displayName}\n`;
        m3u += `${streamUrl}\n`;
      }
    }

    // 如果接口空，提供默认体验条目
    if (items.length === 0) {
      m3u += `#EXTINF:-1 group-title="热门电影",阿牛私人影院 - 4K画质测试\nhttps://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8\n`;
    }

    return new NextResponse(m3u, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800',
      },
    });
  } catch (error) {
    const fallbackM3u = `#EXTM3U\n#EXTINF:-1 group-title="热门电影",阿牛私人影院 - 4K画质测试\nhttps://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8\n`;
    return new NextResponse(fallbackM3u, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
