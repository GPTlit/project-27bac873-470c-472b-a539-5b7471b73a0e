REVOKE EXECUTE ON FUNCTION public.register_push_subscription(TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.disable_push_subscription(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_push_subscription(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_push_subscription(TEXT) TO authenticated;