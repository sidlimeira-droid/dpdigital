-- Database Schema for Sistema DP

-- 1. Profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'colaborador')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. User Signatures (Stored templates)
CREATE TABLE public.user_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    assinatura_imagem TEXT NOT NULL, -- URL to Supabase Storage
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Documents
CREATE TABLE public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('contra_cheque', 'folha_ponto', 'trabalhista')),
    competencia TEXT NOT NULL, -- e.g., "03/2026"
    arquivo_pdf TEXT NOT NULL, -- URL to Supabase Storage
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'assinado')),
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    data_assinatura TIMESTAMP WITH TIME ZONE
);

-- 4. Signatures (Audit log for specific document signings)
CREATE TABLE public.signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    assinatura_imagem TEXT NOT NULL, -- URL to Supabase Storage (snapshot at time of signing)
    ip_usuario TEXT NOT NULL,
    data_assinatura TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Notifications
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for demo, in production use more granular rules)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own signatures" ON public.user_signatures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own signatures" ON public.user_signatures FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id OR (SELECT tipo FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can manage documents" ON public.documents FOR ALL USING ((SELECT tipo FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can view notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Storage Buckets (Run these in the Supabase Dashboard)
-- 1. 'documents' (private)
-- 2. 'signatures' (private)
