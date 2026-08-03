export type MediaType = "image" | "video";

export type ApiMediaFile = {
  id: number;
  root: string;
  parent_folder: string;
  filename: string;
  extension: string;
  type: MediaType;
  size: number;
  modified: number;
  thumbnail_generated: number;
};

export type ApiMediaFilesResponse = {
  items: ApiMediaFile[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  folders: string[];
};

export type MediaItem = {
  id: string;
  type: MediaType;
  title: string;
  thumbnail: string;
  root: string;
  parent_folder: string;
  filename: string;
  extension: string;
  size: number;
  modified: number;
  thumbnail_generated: number;
};

export type ComicBook = {
  id: string;
  title: string;
  author: string;
  issue: string;
  cover: string;
  description: string;
  filename: string;
  year: number | null;
  month: number | null;
  day: number | null;
  genre: string | null;
  tags: string | null;
  web: string | null;
  series: string | null;
  format: string | null;
  page_count: number | null;
  root: string;
  parent_folder: string;
  size: number | null;
  modified: number | null;
};

export type ApiComicBook = {
  id: number;
  root: string;
  parent_folder: string;
  filename: string;
  size: number;
  modified: number;
  title: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  writer: string | null;
  genre: string | null;
  tags: string | null;
  web: string | null;
  series: string | null;
  format: string | null;
  page_count: number | null;
};

export type ApiComicsResponse = {
  items: ApiComicBook[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  authors: [string, number][];
  tags: [string, number][];
};

export type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
