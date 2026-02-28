-- MASTER SQL SCHEMA FOR ROOMRENT NEPAL
-- WARNING: Running this will drop and recreate tables if they exist.

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    role TEXT CHECK (role IN ('seeker', 'provider', 'owner')),
    gender TEXT,
    dob_ad DATE,
    dob_bs TEXT,
    district TEXT,
    municipality TEXT,
    ward INTEGER,
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    wallet_balance DECIMAL DEFAULT 0,
    last_payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_payment_amount DECIMAL DEFAULT 0,
    is_account_active BOOLEAN DEFAULT true,
    lat FLOAT8,
    lng FLOAT8,
    device_info TEXT,
    privacy_accepted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price_nrs DECIMAL NOT NULL,
    rent_category TEXT CHECK (rent_category IN ('hourly', 'daily', 'monthly')),
    district TEXT,
    municipality TEXT,
    ward INTEGER,
    address TEXT,
    amenities TEXT[],
    images TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')) DEFAULT 'pending',
    start_date DATE,
    stay_duration INTEGER,
    total_price_nrs DECIMAL,
    seeker_fee DECIMAL DEFAULT 0,
    provider_fee DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. SAVED ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.saved_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, room_id)
);

-- 5. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. PAYMENTS TABLE (Owner Analytics)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    payment_method TEXT DEFAULT 'eSewa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- POLICIES (Simplified for Owner Access)
-- Profiles: Users can read all (for search), update their own. Owner can read/update all.
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Rooms: Viewable by all, managed by providers.
CREATE POLICY "Rooms are viewable by everyone" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Providers can manage own rooms" ON public.rooms FOR ALL USING (auth.uid() = provider_id);

-- Bookings: Viewable by involved parties and owner.
CREATE POLICY "Parties can view bookings" ON public.bookings FOR SELECT USING (auth.uid() = seeker_id OR auth.uid() = provider_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

-- Messages: Viewable by involved parties.
CREATE POLICY "Parties can view messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ASSIGN OWNER ROLE (Run this after creating the user in Auth)
-- UPDATE public.profiles SET role = 'owner' WHERE email = 'sandeepgaire8@gmail.com';
