/**
 * Firecrawl context extraction handler
 * Extracts job description and form context from pages
 */

import { ExtractContextRequest, ExtractContextResponse, Env, ErrorResponse } from '../types';

export async function handleExtractContext(request: Request, env: Env): Promise<Response> {
  try {
    // Firecrawl is optional
    if (!env.FIRECRAWL_API_KEY) {
      const error: ErrorResponse = {
        error: 'Firecrawl extraction not configured',
        code: 'FIRECRAWL_NOT_CONFIGURED',
      };
      return new Response(JSON.stringify(error), {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json<ExtractContextRequest>();

    if (!body.url) {
      const error: ErrorResponse = {
        error: 'Missing url field',
        code: 'INVALID_REQUEST',
      };
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate URL
    try {
      new URL(body.url);
    } catch {
      const error: ErrorResponse = {
        error: 'Invalid URL format',
        code: 'INVALID_URL',
      };
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call Firecrawl API
    const firecrawlRequest = {
      url: body.url,
      includeHtmlTags: body.include_tags || ['h1', 'h2', 'p', 'li', 'label', 'input', 'textarea'],
      onlyMainContent: true,
    };

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(firecrawlRequest),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Firecrawl API error ${response.status}:`, errorBody);

      const error: ErrorResponse = {
        error: `Firecrawl API error: ${response.status}`,
        code: 'FIRECRAWL_API_ERROR',
        details: { status: response.status, message: errorBody },
      };

      return new Response(JSON.stringify(error), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json() as {
      success: boolean;
      data?: {
        markdown?: string;
        html?: string;
        metadata?: Record<string, unknown>;
      };
    };

    if (!data.success || !data.data) {
      const error: ErrorResponse = {
        error: 'Failed to extract content',
        code: 'EXTRACTION_FAILED',
      };
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Transform to our response format
    const result: ExtractContextResponse = {
      title: (data.data.metadata as Record<string, string> | undefined)?.['og:title'] || '',
      description: (data.data.metadata as Record<string, string> | undefined)?.['og:description'] || '',
      content: data.data.markdown || data.data.html || '',
      metadata: data.data.metadata || {},
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Extract context handler error:', error);

    const err = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse: ErrorResponse = {
      error: err,
      code: 'EXTRACT_HANDLER_ERROR',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
