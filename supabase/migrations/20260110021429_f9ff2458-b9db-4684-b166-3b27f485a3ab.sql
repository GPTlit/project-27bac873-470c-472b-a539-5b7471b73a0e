-- Drop ALL existing policies on groups, group_members, group_messages to start fresh
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Group members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Creators can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;

DROP POLICY IF EXISTS "Group creators can add members" ON public.group_members;
DROP POLICY IF EXISTS "Group members can view other members" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join themselves" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can remove members" ON public.group_members;

DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can view messages" ON public.group_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Members can view group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Members can view messages" ON public.group_messages;

-- Recreate clean policies using SECURITY DEFINER function to avoid recursion

-- GROUPS policies
CREATE POLICY "groups_insert"
ON public.groups FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "groups_select_creator"
ON public.groups FOR SELECT TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "groups_select_member"
ON public.groups FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "groups_update"
ON public.groups FOR UPDATE TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- GROUP_MEMBERS policies
CREATE POLICY "gm_select"
ON public.group_members FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "gm_insert_self"
ON public.group_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gm_insert_creator"
ON public.group_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid())
);

CREATE POLICY "gm_delete_self"
ON public.group_members FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "gm_delete_creator"
ON public.group_members FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid())
);

-- GROUP_MESSAGES policies
CREATE POLICY "msg_select"
ON public.group_messages FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "msg_insert"
ON public.group_messages FOR INSERT TO authenticated
WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = user_id);