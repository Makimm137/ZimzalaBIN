
import { createClient } from '@supabase/supabase-js';

// 注意：在实际部署时，请替换为您的实际 Supabase 项目 URL 和 Anon Key
// 此处假设通过环境变量提供，或者作为占位符
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 数据库表结构建议 (SQL):
 * 
 * create table profiles (
 *   id uuid references auth.users not null primary key,
 *   name text,
 *   bio text,
 *   avatar text,
 *   updated_at timestamp with time zone
 * );
 * 
 * create table collection_items (
 *   id text primary key,
 *   user_id uuid references auth.users,
 *   name text not null,
 *   ip text,
 *   character text,
 *   price numeric,
 *   status text,
 *   category text,
 *   image_url text,
 *   quantity integer default 1,
 *   purchase_date text,
 *   notes text,
 *   is_pinned boolean default false,
 *   is_reminder_enabled boolean default false,
 *   created_at timestamp with time zone default now()
 * );
 */
