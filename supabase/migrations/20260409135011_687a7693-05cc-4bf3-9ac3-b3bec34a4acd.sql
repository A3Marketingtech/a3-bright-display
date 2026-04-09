
-- News cache table
CREATE TABLE public.news_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  source TEXT NOT NULL,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  content_hash TEXT NOT NULL UNIQUE
);

-- News fetch log for tracking API usage
CREATE TABLE public.news_fetch_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'success',
  articles_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  provider TEXT NOT NULL DEFAULT 'gnews'
);

-- Enable RLS
ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_fetch_log ENABLE ROW LEVEL SECURITY;

-- Public read access for news cache (display screens need to read)
CREATE POLICY "Anyone can read news cache" ON public.news_cache FOR SELECT USING (true);

-- Public read access for fetch log (admin panel needs to read)
CREATE POLICY "Anyone can read fetch log" ON public.news_fetch_log FOR SELECT USING (true);

-- Only service role can insert/update/delete (edge functions)
-- No INSERT/UPDATE/DELETE policies for anon = only service_role can write

-- Index for fast ordering
CREATE INDEX idx_news_cache_published ON public.news_cache (published_at DESC);
CREATE INDEX idx_news_fetch_log_fetched ON public.news_fetch_log (fetched_at DESC);
