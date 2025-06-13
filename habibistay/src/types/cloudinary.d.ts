import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

declare module 'cloudinary' {
  const v2: {
    config: (config: {
      cloud_name: string;
      api_key: string;
      api_secret: string;
      secure?: boolean;
    }) => void;
    
    uploader: {
      upload: (
        file: string | Buffer,
        options?: Record<string, any>
      ) => Promise<UploadApiResponse | UploadApiErrorResponse>;
      
      destroy: (
        publicId: string,
        options?: Record<string, any>
      ) => Promise<{ result: string }>;
      
      upload_large: (
        file: string | Buffer,
        options?: Record<string, any>
      ) => Promise<UploadApiResponse | UploadApiErrorResponse>;
    };
    
    url: (publicId: string, options?: Record<string, any>) => string;
    
    utils: {
      sign_request: (params: Record<string, any>, options?: { secret: string }) => { signature: string; api_key: string };
      api_sign_request: (params: Record<string, any>, apiSecret: string) => string;
      private_download_url: (publicId: string, format: string, options?: Record<string, any>) => string;
      video_thumbnail_url: (publicId: string, options?: Record<string, any>) => string;
      video_url: (publicId: string, options?: Record<string, any>) => string;
    };
  };
  
  export = {
    v2,
  };
}

export interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
  moderation: any[];
  access_control: any[];
  context: Record<string, string>;
  metadata: Record<string, any>;
  colors?: [string, number][];
  predominant: {
    google: [string, number][];
  };
  delete_token: string;
  error?: {
    message: string;
  };
}

export interface CloudinaryDeleteResult {
  result: string;
  error?: {
    message: string;
  };
}
