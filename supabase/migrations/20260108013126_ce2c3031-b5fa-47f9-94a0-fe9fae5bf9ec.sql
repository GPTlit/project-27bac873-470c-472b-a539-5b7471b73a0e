-- Drop the problematic RLS policies that cause recursion
DROP POLICY IF EXISTS "Group members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Group members can view other members" ON public.group_members;
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can view messages" ON public.group_messages;

-- Create a security definer function to check group membership without recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Group members can view their groups" 
ON public.groups 
FOR SELECT 
USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Group members can view other members" 
ON public.group_members 
FOR SELECT 
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can send messages" 
ON public.group_messages 
FOR INSERT 
WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = user_id);

CREATE POLICY "Group members can view messages" 
ON public.group_messages 
FOR SELECT 
USING (public.is_group_member(auth.uid(), group_id));