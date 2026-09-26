-- 2026-09-26のオンラインランキング接続テストで作成した30件だけを削除します。
-- Supabase SQL Editorで実行してください。ゲーム本番データは対象外です。
begin;

delete from public.ufo_rankings
where id in (
  'e20a1c1b-8f50-4792-9dd6-b8ae3d58ce4a',
  'a88cbeef-41af-4927-b5b7-ca3dbebad960',
  'b880d5a0-582d-43a3-8df5-bb8ffd9455fb',
  '6757389d-7acd-4a26-92a0-3eef3a216bce',
  'f2ee891b-6455-4d3f-9e21-57b20647c76a',
  'acddd3e5-1950-44bb-90e9-b4367386618a',
  'c073830f-29f7-46e6-bedc-664e1a2d18c7',
  'fbfd7f69-3d75-4aba-9a7a-89c38ff88917',
  'e53ba3d7-18a7-4e20-9d86-284a135605f9',
  '40b592db-3646-4d26-9b3d-37febb219ab9',
  'd4d34543-e2ff-43e6-9fac-22a6b1bc4465',
  'aa359292-bf83-4c5c-b71b-5ccdf0bb2dc2',
  'bc9e3063-cf50-4b4b-ac30-e08caa43a6ec',
  'f0e42838-6220-4f3e-9e6a-f7a0dbe32826',
  '2b1476b0-dc4f-4398-a456-9b5c761eeade',
  'bcfac85b-a230-47c2-9943-56fae0428a68',
  'ac5785ad-3c2f-4ef6-8d07-5ff8b23b3b07',
  'dea58647-df34-42b5-a33c-b1466367cb59',
  '474dfe58-c19a-4262-9b6c-3850537ee6a9',
  'a27c763e-08a3-40f8-bfd0-aaf1ce37e309',
  'beae1deb-b768-4112-af61-ffc3f89ba877',
  '02dda992-f6f8-46eb-ae44-72ffbba9bc5e',
  'd0e3634c-e3fe-484b-9936-0293c5625915',
  '57cdc114-2432-4508-8b66-4dc514e3f207',
  'c992dca8-2fe9-457c-83c2-184db091c95a',
  '885f6f8c-e6fa-4db0-969b-9c00d9947e48',
  '60e6c3ad-9c7d-42fd-b970-7b7cdfb4a35d',
  '9ca1dee2-c3c0-4181-ae93-59854626ca01',
  'b900a943-1996-4a7d-bd39-1b795ede56d7',
  '23b6fcb4-cd8c-4cd5-bfb9-0f2db8bb6d21'
)
returning id, player_name, score, catches;

commit;
