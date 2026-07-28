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
};

export type MediaItem = {
  id: string;
  type: MediaType;
  title: string;
  thumbnail: string;
  parent_folder: string;
};

export type ComicBook = {
  id: string;
  title: string;
  author: string;
  issue: string;
  cover: string;
  description: string;
};

export type ApiComicBook = {
  id: number;
  filename: string;
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

export type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
