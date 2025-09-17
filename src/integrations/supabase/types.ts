export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      academy_courses: {
        Row: {
          category: string
          course_data: Json
          created_at: string
          description: string | null
          difficulty_level: string | null
          enrollment_count: number | null
          id: string
          instructor_id: string
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          course_data?: Json
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          enrollment_count?: number | null
          id?: string
          instructor_id: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          course_data?: Json
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          enrollment_count?: number | null
          id?: string
          instructor_id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      academy_enrollments: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          course_id: string | null
          enrolled_at: string
          id: string
          progress_data: Json
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          course_id?: string | null
          enrolled_at?: string
          id?: string
          progress_data?: Json
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          course_id?: string | null
          enrolled_at?: string
          id?: string
          progress_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lessons: {
        Row: {
          content_data: Json
          content_type: string | null
          course_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          content_data?: Json
          content_type?: string | null
          course_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          content_data?: Json
          content_type?: string | null
          course_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_context_memory: {
        Row: {
          access_count: number | null
          context_data: Json
          context_key: string
          context_type: string | null
          created_at: string
          id: string
          importance_score: number | null
          last_accessed: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          context_data?: Json
          context_key: string
          context_type?: string | null
          created_at?: string
          id?: string
          importance_score?: number | null
          last_accessed?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          context_data?: Json
          context_key?: string
          context_type?: string | null
          created_at?: string
          id?: string
          importance_score?: number | null
          last_accessed?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      artist_licenses: {
        Row: {
          artist_id: string
          compensation_rate: number | null
          created_at: string
          id: string
          is_active: boolean | null
          license_type: string | null
          terms_data: Json
          updated_at: string
        }
        Insert: {
          artist_id: string
          compensation_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_type?: string | null
          terms_data?: Json
          updated_at?: string
        }
        Update: {
          artist_id?: string
          compensation_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_type?: string | null
          terms_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      aura_conductor_sessions: {
        Row: {
          created_at: string
          current_task: string | null
          execution_log: Json
          id: string
          is_active: boolean | null
          orchestration_config: Json
          session_name: string
          task_queue: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_task?: string | null
          execution_log?: Json
          id?: string
          is_active?: boolean | null
          orchestration_config?: Json
          session_name: string
          task_queue?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_task?: string | null
          execution_log?: Json
          id?: string
          is_active?: boolean | null
          orchestration_config?: Json
          session_name?: string
          task_queue?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_lanes: {
        Row: {
          automation_points: Json
          created_at: string
          effect_id: string | null
          id: string
          is_enabled: boolean | null
          parameter_name: string
          parameter_type: string
          project_id: string | null
          track_id: string
          updated_at: string
        }
        Insert: {
          automation_points?: Json
          created_at?: string
          effect_id?: string | null
          id?: string
          is_enabled?: boolean | null
          parameter_name: string
          parameter_type?: string
          project_id?: string | null
          track_id: string
          updated_at?: string
        }
        Update: {
          automation_points?: Json
          created_at?: string
          effect_id?: string | null
          id?: string
          is_enabled?: boolean | null
          parameter_name?: string
          parameter_type?: string
          project_id?: string | null
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_lanes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "daw_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_participants: {
        Row: {
          current_tool: string | null
          cursor_position: Json | null
          id: string
          is_active: boolean | null
          joined_at: string
          last_seen: string
          permissions: Json | null
          session_id: string | null
          user_color: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          current_tool?: string | null
          cursor_position?: Json | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          last_seen?: string
          permissions?: Json | null
          session_id?: string | null
          user_color?: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          current_tool?: string | null
          cursor_position?: Json | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          last_seen?: string
          permissions?: Json | null
          session_id?: string | null
          user_color?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "collaboration_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_sessions: {
        Row: {
          created_at: string
          host_user_id: string | null
          id: string
          is_active: boolean | null
          participant_limit: number | null
          project_id: string | null
          session_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          host_user_id?: string | null
          id?: string
          is_active?: boolean | null
          participant_limit?: number | null
          project_id?: string | null
          session_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          host_user_id?: string | null
          id?: string
          is_active?: boolean | null
          participant_limit?: number | null
          project_id?: string | null
          session_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "daw_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          like_count: number | null
          parent_comment_id: string | null
          post_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          like_count?: number | null
          parent_comment_id?: string | null
          post_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          like_count?: number | null
          parent_comment_id?: string | null
          post_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          comment_count: number | null
          content: string | null
          created_at: string
          id: string
          is_featured: boolean | null
          like_count: number | null
          media_urls: string[] | null
          post_type: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_earnings: {
        Row: {
          amount_cents: number
          created_at: string
          creator_id: string
          currency: string | null
          earning_type: string
          id: string
          post_id: string | null
          processed_at: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          creator_id: string
          currency?: string | null
          earning_type: string
          id?: string
          post_id?: string | null
          processed_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          creator_id?: string
          currency?: string | null
          earning_type?: string
          id?: string
          post_id?: string | null
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      daw_projects: {
        Row: {
          bpm: number
          created_at: string
          id: string
          key_signature: string | null
          name: string
          project_data: Json
          time_signature: string | null
          updated_at: string
          user_id: string | null
          version: number
        }
        Insert: {
          bpm?: number
          created_at?: string
          id?: string
          key_signature?: string | null
          name: string
          project_data: Json
          time_signature?: string | null
          updated_at?: string
          user_id?: string | null
          version?: number
        }
        Update: {
          bpm?: number
          created_at?: string
          id?: string
          key_signature?: string | null
          name?: string
          project_data?: Json
          time_signature?: string | null
          updated_at?: string
          user_id?: string | null
          version?: number
        }
        Relationships: []
      }
      licensed_content: {
        Row: {
          content_type: string | null
          content_url: string
          created_at: string
          id: string
          license_id: string | null
          metadata: Json
          usage_count: number | null
        }
        Insert: {
          content_type?: string | null
          content_url: string
          created_at?: string
          id?: string
          license_id?: string | null
          metadata?: Json
          usage_count?: number | null
        }
        Update: {
          content_type?: string | null
          content_url?: string
          created_at?: string
          id?: string
          license_id?: string | null
          metadata?: Json
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "licensed_content_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "artist_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          active: boolean | null
          category: string
          created_at: string
          currency: string | null
          description: string | null
          download_url: string | null
          downloads: number | null
          featured: boolean | null
          id: string
          image_url: string | null
          name: string
          preview_url: string | null
          price_cents: number
          rating: number | null
          seller_id: string | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string
          currency?: string | null
          description?: string | null
          download_url?: string | null
          downloads?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          preview_url?: string | null
          price_cents: number
          rating?: number | null
          seller_id?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          download_url?: string | null
          downloads?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          preview_url?: string | null
          price_cents?: number
          rating?: number | null
          seller_id?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          product_id: string | null
          product_type: string | null
          status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          product_id?: string | null
          product_type?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          product_id?: string | null
          product_type?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          like_count: number | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          like_count?: number | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          like_count?: number | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_seller: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_seller?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_seller?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_analytics: {
        Row: {
          actions_performed: Json
          ai_interactions: number | null
          analytics_data: Json
          created_at: string
          id: string
          project_id: string
          session_duration: number | null
          user_id: string
        }
        Insert: {
          actions_performed?: Json
          ai_interactions?: number | null
          analytics_data?: Json
          created_at?: string
          id?: string
          project_id: string
          session_duration?: number | null
          user_id: string
        }
        Update: {
          actions_performed?: Json
          ai_interactions?: number | null
          analytics_data?: Json
          created_at?: string
          id?: string
          project_id?: string
          session_duration?: number | null
          user_id?: string
        }
        Relationships: []
      }
      project_changes: {
        Row: {
          change_data: Json
          change_type: string
          id: string
          project_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          change_data: Json
          change_type: string
          id?: string
          project_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          change_data?: Json
          change_type?: string
          id?: string
          project_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_changes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "daw_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      samples: {
        Row: {
          bpm: number | null
          category: string
          created_at: string
          description: string | null
          duration: number
          file_size: number | null
          file_url: string
          id: string
          is_public: boolean | null
          key_signature: string | null
          name: string
          tags: string[] | null
          updated_at: string
          user_id: string | null
          waveform_data: Json | null
        }
        Insert: {
          bpm?: number | null
          category?: string
          created_at?: string
          description?: string | null
          duration?: number
          file_size?: number | null
          file_url: string
          id?: string
          is_public?: boolean | null
          key_signature?: string | null
          name: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          waveform_data?: Json | null
        }
        Update: {
          bpm?: number | null
          category?: string
          created_at?: string
          description?: string | null
          duration?: number
          file_size?: number | null
          file_url?: string
          id?: string
          is_public?: boolean | null
          key_signature?: string | null
          name?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          waveform_data?: Json | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          ai_model_used: string | null
          audio_url: string
          comment_count: number | null
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          duration_seconds: number | null
          generation_params: Json | null
          genre_tags: string[] | null
          id: string
          is_featured: boolean | null
          is_remix: boolean | null
          like_count: number | null
          original_post_id: string | null
          play_count: number | null
          preview_url: string | null
          remix_count: number | null
          remix_style: string | null
          share_count: number | null
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          ai_model_used?: string | null
          audio_url: string
          comment_count?: number | null
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          duration_seconds?: number | null
          generation_params?: Json | null
          genre_tags?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_remix?: boolean | null
          like_count?: number | null
          original_post_id?: string | null
          play_count?: number | null
          preview_url?: string | null
          remix_count?: number | null
          remix_style?: string | null
          share_count?: number | null
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          ai_model_used?: string | null
          audio_url?: string
          comment_count?: number | null
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          duration_seconds?: number | null
          generation_params?: Json | null
          genre_tags?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_remix?: boolean | null
          like_count?: number | null
          original_post_id?: string | null
          play_count?: number | null
          preview_url?: string | null
          remix_count?: number | null
          remix_style?: string | null
          share_count?: number | null
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      style_profiles: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          download_count: number | null
          genre_tags: string[] | null
          id: string
          is_public: boolean | null
          name: string
          preview_url: string | null
          price_cents: number | null
          rating: number | null
          style_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          download_count?: number | null
          genre_tags?: string[] | null
          id?: string
          is_public?: boolean | null
          name: string
          preview_url?: string | null
          price_cents?: number | null
          rating?: number | null
          style_data: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          download_count?: number | null
          genre_tags?: string[] | null
          id?: string
          is_public?: boolean | null
          name?: string
          preview_url?: string | null
          price_cents?: number | null
          rating?: number | null
          style_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_plugin_installations: {
        Row: {
          id: string
          installation_config: Json
          installed_at: string
          is_active: boolean | null
          plugin_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          installation_config?: Json
          installed_at?: string
          is_active?: boolean | null
          plugin_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          installation_config?: Json
          installed_at?: string
          is_active?: boolean | null
          plugin_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plugin_installations_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "web_plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      user_purchases: {
        Row: {
          id: string
          marketplace_item_id: string | null
          order_id: string | null
          purchased_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          marketplace_item_id?: string | null
          order_id?: string | null
          purchased_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          marketplace_item_id?: string | null
          order_id?: string | null
          purchased_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      web_plugins: {
        Row: {
          created_at: string
          developer_id: string
          download_count: number | null
          id: string
          is_approved: boolean | null
          manifest_data: Json
          name: string
          plugin_code: string
          plugin_type: string | null
          rating: number | null
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          developer_id: string
          download_count?: number | null
          id?: string
          is_approved?: boolean | null
          manifest_data?: Json
          name: string
          plugin_code: string
          plugin_type?: string | null
          rating?: number | null
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          developer_id?: string
          download_count?: number | null
          id?: string
          is_approved?: boolean | null
          manifest_data?: Json
          name?: string
          plugin_code?: string
          plugin_type?: string | null
          rating?: number | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: "free" | "producer" | "professional" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_tier: ["free", "producer", "professional", "enterprise"],
    },
  },
} as const
