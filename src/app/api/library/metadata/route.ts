import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  try {
    // 1. YouTube Specific Logic
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
    if (ytMatch) {
      const videoId = ytMatch[1].split('&')[0];
      return NextResponse.json({
        title: `YouTube Video (${videoId})`, // Title can be refined later if needed
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        type: 'video',
        source: 'YouTube'
      });
    }

    // 2. Generic OG Scraper
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await response.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const ogImageMatch = html.match(/<meta property="og:image" content="(.*?)"/i);
    
    return NextResponse.json({
      title: titleMatch ? titleMatch[1] : 'Unknown Title',
      thumbnail: ogImageMatch ? ogImageMatch[1] : null,
      type: url.includes('tool') || url.includes('app') ? 'tool' : 'link',
      source: new URL(url).hostname
    });

  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
