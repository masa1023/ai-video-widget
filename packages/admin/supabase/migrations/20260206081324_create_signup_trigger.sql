-- =============================================================================
-- Triggers
-- =============================================================================

-- updated_at を自動更新するトリガー関数
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルに updated_at トリガーを設定
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slots_updated_at
    BEFORE UPDATE ON slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversion_rules_updated_at
    BEFORE UPDATE ON conversion_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger function to create organization and profile on user signup
-- This runs with security definer privileges to bypass RLS
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
  user_display_name TEXT;
BEGIN
  -- Extract organization name from user metadata
  org_name := COALESCE(
    NEW.raw_user_meta_data ->> 'organization_name',
    'My Organization'
  );
  
  -- Extract display name from user metadata
  user_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- Create the organization (starts as inactive until email confirmed)
  INSERT INTO public.organizations (name, status)
  VALUES (org_name, 'inactive')
  RETURNING id INTO new_org_id;

  -- Create the user's profile as owner
  INSERT INTO public.profiles (id, organization_id, email, role, display_name)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.email,
    'owner',
    user_display_name
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger to run after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to activate organization when email is confirmed
CREATE FUNCTION public.handle_user_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Activate organization when user confirms email
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.organizations
    SET status = 'active', updated_at = NOW()
    WHERE id = (
      SELECT organization_id FROM public.profiles WHERE id = NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to activate org when email confirmed
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_confirmed();
