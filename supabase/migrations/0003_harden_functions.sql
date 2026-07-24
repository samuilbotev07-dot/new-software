-- handle_new_user се вика само от тригера — никой не бива да я извиква през API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
