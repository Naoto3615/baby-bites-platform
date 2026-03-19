import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { NewsQueryDto } from './dto/news-query.dto';

type GooglePlacesItem = {
  name?: string;
  vicinity?: string;
  rating?: number;
  place_id?: string;
};

type GooglePlacesResponse = {
  results?: GooglePlacesItem[];
};

type GoogleCseItem = {
  title?: string;
  link?: string;
  snippet?: string;
};

type GoogleCseResponse = {
  items?: GoogleCseItem[];
};

@Injectable()
export class ResourcesService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private async getCached(provider: string, queryKey: string) {
    const now = new Date();
    return this.prisma.externalResourceCache
      .findUnique({
        where: { provider_queryKey: { provider, queryKey } },
      })
      .then((row) => {
        if (!row) return null;
        if (row.expiresAt < now) return null;
        return row.payload;
      });
  }

  private async setCache(
    provider: string,
    queryKey: string,
    payload: unknown,
    ttlSeconds: number,
  ) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const jsonPayload = payload as Prisma.InputJsonValue;

    await this.prisma.externalResourceCache.upsert({
      where: { provider_queryKey: { provider, queryKey } },
      update: {
        payload: jsonPayload,
        fetchedAt: new Date(),
        expiresAt,
      },
      create: {
        provider,
        queryKey,
        payload: jsonPayload,
        expiresAt,
      },
    });
  }

  async getNearby(query: NearbyQueryDto) {
    const keyword = query.keyword ?? '小児科';
    const queryKey = `lat=${query.lat}&lng=${query.lng}&keyword=${keyword}`;

    const cached = await this.getCached('google_places', queryKey);
    if (cached) {
      return { provider: 'google_places', source: 'cache', data: cached };
    }

    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      const fallback = {
        items: [
          {
            name: 'サンプル小児科クリニック',
            vicinity: '東京都内',
            rating: 4.2,
          },
        ],
        note: 'GOOGLE_MAPS_API_KEY が未設定のためサンプルデータを返却',
      };
      return { provider: 'fallback', source: 'mock', data: fallback };
    }

    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

    const response = await firstValueFrom(
      this.http.get<GooglePlacesResponse>(url, {
        params: {
          location: `${query.lat},${query.lng}`,
          radius: 3000,
          keyword,
          key: apiKey,
          language: 'ja',
        },
      }),
    );

    const payload = {
      items: (response.data.results ?? []).slice(0, 10).map((item) => ({
        name: item.name ?? '名称未設定',
        vicinity: item.vicinity ?? '',
        rating: item.rating,
        placeId: item.place_id,
      })),
    };

    await this.setCache('google_places', queryKey, payload, 900);
    return { provider: 'google_places', source: 'live', data: payload };
  }

  async getNews(query: NewsQueryDto) {
    const q = query.query ?? '離乳食 アレルギー';
    const queryKey = `q=${q}`;

    const cached = await this.getCached('news_search', queryKey);
    if (cached) {
      return { provider: 'news_search', source: 'cache', data: cached };
    }

    const googleCseKey = this.config.get<string>('GOOGLE_CSE_API_KEY');
    const googleCseCx = this.config.get<string>('GOOGLE_CSE_ENGINE_ID');

    if (googleCseKey && googleCseCx) {
      const response = await firstValueFrom(
        this.http.get<GoogleCseResponse>(
          'https://www.googleapis.com/customsearch/v1',
          {
            params: {
              key: googleCseKey,
              cx: googleCseCx,
              q,
              num: 10,
              hl: 'ja',
            },
          },
        ),
      );

      const payload = {
        items: (response.data.items ?? []).map((item) => ({
          title: item.title ?? 'タイトル未設定',
          link: item.link ?? '',
          snippet: item.snippet ?? '',
          source: 'google_cse',
        })),
      };

      await this.setCache('news_search', queryKey, payload, 900);
      return { provider: 'google_cse', source: 'live', data: payload };
    }

    const yahooAppId = this.config.get<string>('YAHOO_APP_ID');
    const yahooBase =
      this.config.get<string>('YAHOO_API_BASE_URL') ??
      'https://map.yahooapis.jp';

    if (yahooAppId) {
      const payload = {
        items: [
          {
            title: 'Yahoo API連携用の設定が有効です',
            link: yahooBase,
            snippet:
              '本番では利用するYahoo APIエンドポイントに接続してください。',
            source: 'yahoo_placeholder',
          },
        ],
      };

      await this.setCache('news_search', queryKey, payload, 900);
      return { provider: 'yahoo', source: 'configured', data: payload };
    }

    const fallback = {
      items: [
        {
          title: '離乳食の基本ガイド',
          link: 'https://naoto3615.github.io/',
          snippet: 'APIキー未設定時のサンプルデータです。',
          source: 'fallback',
        },
      ],
      note: 'GOOGLE_CSE_API_KEY / YAHOO_APP_ID が未設定のためサンプルデータを返却',
    };

    return { provider: 'fallback', source: 'mock', data: fallback };
  }
}
