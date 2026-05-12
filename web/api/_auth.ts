import { createClient } from '@supabase/supabase-js';

export async function verifyJWT(req: any): Promise<string | null> {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id ?? null;
}
