-- InsurMatch: demo seed data
-- Creates 10 demo agents (via auth.users + agent_profiles) with
-- realistic Indian names, cities, specialties, and reviews.
-- NOTE: run this only in local/dev environments.

do $$
declare
  agent_ids uuid[] := array[
    'a1111111-1111-1111-1111-111111111101',
    'a1111111-1111-1111-1111-111111111102',
    'a1111111-1111-1111-1111-111111111103',
    'a1111111-1111-1111-1111-111111111104',
    'a1111111-1111-1111-1111-111111111105',
    'a1111111-1111-1111-1111-111111111106',
    'a1111111-1111-1111-1111-111111111107',
    'a1111111-1111-1111-1111-111111111108',
    'a1111111-1111-1111-1111-111111111109',
    'a1111111-1111-1111-1111-111111111110'
  ];
  demo_client_id uuid := 'b2222222-2222-2222-2222-222222222201';
begin
  -- Create matching auth.users rows (email confirmed, no password login needed for seed)
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values
    (agent_ids[1], 'priya.sharma@insurmatch.demo', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (agent_ids[2], 'rajesh.kumar@insurmatch.demo', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (agent_ids[3], 'anjali.mehta@insurmatch.demo', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (agent_ids[4], 'vikram.singh@insurmatch.demo', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (agent_ids[5], 'sunita.rao@insurmatch.demo', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (agent_ids[6], 'arjun.nair@insurmatch.demo', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (agent_ids[7], 'kavita.joshi@insurmatch.demo', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (agent_ids[8], 'manoj.reddy@insurmatch.demo', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (agent_ids[9], 'neha.gupta@insurmatch.demo', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (agent_ids[10], 'sameer.khan@insurmatch.demo', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (demo_client_id, 'demo.client@insurmatch.demo', crypt('demo12345', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  on conflict (id) do nothing;

  insert into client_profiles (id, full_name, email, contact_number, location)
  values (demo_client_id, 'Demo Client', 'demo.client@insurmatch.demo', '+91 98765 43210', 'Mumbai, Maharashtra')
  on conflict (id) do nothing;

  insert into agent_profiles (id, full_name, email, bio, years_experience, license_number, license_state, specialties, companies, base_location, service_areas, is_all_india, embedding_text)
  values
    (agent_ids[1], 'Priya Sharma', 'priya.sharma@insurmatch.demo',
      'Priya has spent over a decade helping families in Mumbai secure the right life and health cover. She specializes in explaining policy fine print in plain language and is known for fast claim support.',
      11, 'IRDA-LIC-88234', 'Maharashtra', '["Life","Health","Term"]', '["LIC","HDFC Life","Star Health"]',
      'Mumbai', '["Mumbai","Thane","Navi Mumbai"]', false,
      'Priya Sharma Life Health Term LIC HDFC Life Star Health Mumbai Thane Navi Mumbai 11 years experience family insurance planning'),

    (agent_ids[2], 'Rajesh Kumar', 'rajesh.kumar@insurmatch.demo',
      'Rajesh focuses on commercial and auto insurance for small business owners across Delhi NCR, with a strong track record in fleet policies and quick claim settlements.',
      9, 'IRDA-TATA-55123', 'Delhi', '["Auto","Commercial","Home"]', '["TATA AIG","ICICI Prudential"]',
      'New Delhi', '["Delhi","Gurugram","Noida"]', false,
      'Rajesh Kumar Auto Commercial Home TATA AIG ICICI Prudential Delhi Gurugram Noida fleet business insurance 9 years experience'),

    (agent_ids[3], 'Anjali Mehta', 'anjali.mehta@insurmatch.demo',
      'Anjali is a Bengaluru-based agent serving tech professionals with term life, critical illness, and health top-up plans, with all-India servicing for remote clients.',
      7, 'IRDA-ICICI-77341', 'Karnataka', '["Term","Critical Illness","Health"]', '["ICICI Prudential","Max Life","Star Health"]',
      'Bengaluru', '["Bengaluru","Mysuru"]', true,
      'Anjali Mehta Term Critical Illness Health ICICI Prudential Max Life Star Health Bengaluru tech professionals all India 7 years experience'),

    (agent_ids[4], 'Vikram Singh', 'vikram.singh@insurmatch.demo',
      'Vikram brings 15 years of experience in home and travel insurance, helping NRIs and frequent travelers from Chandigarh find the right coverage before they fly out.',
      15, 'IRDA-TATA-40219', 'Punjab', '["Home","Travel","Auto"]', '["TATA AIG","Bajaj Allianz"]',
      'Chandigarh', '["Chandigarh","Mohali","Panchkula"]', true,
      'Vikram Singh Home Travel Auto TATA AIG Bajaj Allianz Chandigarh NRI travelers all India 15 years experience'),

    (agent_ids[5], 'Sunita Rao', 'sunita.rao@insurmatch.demo',
      'Sunita specializes in health insurance for senior citizens and joint family floater plans, based in Hyderabad with a reputation for patient, thorough consultations.',
      13, 'IRDA-STAR-61207', 'Telangana', '["Health","Critical Illness"]', '["Star Health","HDFC Life"]',
      'Hyderabad', '["Hyderabad","Secunderabad"]', false,
      'Sunita Rao Health Critical Illness Star Health HDFC Life Hyderabad senior citizens family floater 13 years experience'),

    (agent_ids[6], 'Arjun Nair', 'arjun.nair@insurmatch.demo',
      'Arjun helps young professionals in Kochi start their insurance journey with affordable term and auto policies, with a digital-first, low-hassle process.',
      5, 'IRDA-MAX-30987', 'Kerala', '["Term","Auto","Life"]', '["Max Life","ICICI Prudential"]',
      'Kochi', '["Kochi","Ernakulam"]', false,
      'Arjun Nair Term Auto Life Max Life ICICI Prudential Kochi young professionals digital first 5 years experience'),

    (agent_ids[7], 'Kavita Joshi', 'kavita.joshi@insurmatch.demo',
      'Kavita is a Pune-based specialist in commercial and home insurance for manufacturing SMEs, with deep knowledge of industrial risk assessment.',
      10, 'IRDA-BAJAJ-52871', 'Maharashtra', '["Commercial","Home"]', '["Bajaj Allianz","TATA AIG"]',
      'Pune', '["Pune","Pimpri-Chinchwad"]', false,
      'Kavita Joshi Commercial Home Bajaj Allianz TATA AIG Pune manufacturing SME industrial risk 10 years experience'),

    (agent_ids[8], 'Manoj Reddy', 'manoj.reddy@insurmatch.demo',
      'Manoj serves clients across Chennai and Tamil Nadu with life and term insurance, focusing on first-time policy buyers and simplified onboarding.',
      6, 'IRDA-LIC-91045', 'Tamil Nadu', '["Life","Term","Health"]', '["LIC","Star Health"]',
      'Chennai', '["Chennai","Coimbatore"]', false,
      'Manoj Reddy Life Term Health LIC Star Health Chennai Coimbatore first time buyers 6 years experience'),

    (agent_ids[9], 'Neha Gupta', 'neha.gupta@insurmatch.demo',
      'Neha is an all-India travel and health insurance specialist based in Jaipur, working closely with students heading abroad and their families.',
      8, 'IRDA-TATA-38562', 'Rajasthan', '["Travel","Health","Critical Illness"]', '["TATA AIG","Star Health"]',
      'Jaipur', '["Jaipur","Udaipur"]', true,
      'Neha Gupta Travel Health Critical Illness TATA AIG Star Health Jaipur students abroad all India 8 years experience'),

    (agent_ids[10], 'Sameer Khan', 'sameer.khan@insurmatch.demo',
      'Sameer specializes in auto and commercial fleet insurance for logistics companies in Ahmedabad and across Gujarat, with fast, paperwork-light renewals.',
      12, 'IRDA-ICICI-64738', 'Gujarat', '["Auto","Commercial"]', '["ICICI Prudential","Bajaj Allianz"]',
      'Ahmedabad', '["Ahmedabad","Surat","Vadodara"]', false,
      'Sameer Khan Auto Commercial ICICI Prudential Bajaj Allianz Ahmedabad Surat Vadodara Gujarat logistics fleet 12 years experience')
  on conflict (id) do nothing;

  -- Sample completed consultations + reviews so rating_avg/review_count populate
  insert into consultations (id, client_id, agent_id, status, scheduled_at, notes)
  values
    ('c3333333-3333-3333-3333-333333333301', demo_client_id, agent_ids[1], 'completed', now() - interval '20 days', 'Discussed term + health bundle'),
    ('c3333333-3333-3333-3333-333333333302', demo_client_id, agent_ids[3], 'completed', now() - interval '12 days', 'Critical illness review'),
    ('c3333333-3333-3333-3333-333333333303', demo_client_id, agent_ids[9], 'confirmed', now() + interval '4 days', 'Travel insurance for study abroad')
  on conflict (id) do nothing;

  insert into reviews (consultation_id, client_id, agent_id, rating, feedback_text)
  values
    ('c3333333-3333-3333-3333-333333333301', demo_client_id, agent_ids[1], 5, 'Priya explained everything clearly and got my claim processed quickly.'),
    ('c3333333-3333-3333-3333-333333333302', demo_client_id, agent_ids[3], 4, 'Very knowledgeable, though follow-up took a couple of days.')
  on conflict do nothing;

  -- Extra ratings across other agents so the directory looks populated
  update agent_profiles set rating_avg = 4.8, review_count = 24 where id = agent_ids[2];
  update agent_profiles set rating_avg = 4.6, review_count = 31 where id = agent_ids[4];
  update agent_profiles set rating_avg = 4.9, review_count = 18 where id = agent_ids[5];
  update agent_profiles set rating_avg = 4.3, review_count = 9  where id = agent_ids[6];
  update agent_profiles set rating_avg = 4.7, review_count = 15 where id = agent_ids[7];
  update agent_profiles set rating_avg = 4.4, review_count = 12 where id = agent_ids[8];
  update agent_profiles set rating_avg = 4.9, review_count = 27 where id = agent_ids[9];
  update agent_profiles set rating_avg = 4.5, review_count = 20 where id = agent_ids[10];
end $$;
