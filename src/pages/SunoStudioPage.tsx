import React from 'react';
import { User } from '@supabase/supabase-js';
import { SunoStudio } from '@/components/suno-studio/SunoStudio';

interface SunoStudioPageProps {
  user: User | null;
}

const SunoStudioPage: React.FC<SunoStudioPageProps> = ({ user }) => {
  return <SunoStudio user={user} />;
};

export default SunoStudioPage;
