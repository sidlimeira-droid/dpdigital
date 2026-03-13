-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'colaborador')) DEFAULT 'colaborador',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('contra_cheque', 'folha_ponto', 'trabalhista')),
  competencia TEXT NOT NULL,
  arquivo_pdf TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'assinado')) DEFAULT 'pendente',
  data_envio TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  data_assinatura TIMESTAMP WITH TIME ZONE
);

-- Create user_signature table
CREATE TABLE user_signature (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  assinatura_imagem TEXT NOT NULL,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create signatures audit table
CREATE TABLE signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  assinatura_imagem TEXT NOT NULL,
  ip_usuario TEXT,
  data_assinatura TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_signature ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles." ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tipo = 'admin')
);

-- Documents Policies
CREATE POLICY "Admins can do everything with documents." ON documents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tipo = 'admin')
);
CREATE POLICY "Users can view own documents." ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own documents status." ON documents FOR UPDATE USING (auth.uid() = user_id);

-- User Signature Policies
CREATE POLICY "Users can select own signature." ON user_signature FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own signature." ON user_signature FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own signature." ON user_signature FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all signatures images." ON user_signature FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tipo = 'admin')
);

-- Signatures Policies
CREATE POLICY "Admins can view all signatures logs." ON signatures FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tipo = 'admin')
);
CREATE POLICY "Users can view own signatures logs." ON signatures FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents WHERE id = signatures.document_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own signatures logs." ON signatures FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM documents WHERE id = signatures.document_id AND user_id = auth.uid())
);

-- Notifications Policies
CREATE POLICY "Users can select own notifications." ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications." ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert notifications." ON notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tipo = 'admin')
);
CREATE POLICY "Users can delete own notifications." ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, cpf, email, tipo)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', 'Novo Usuário'),
    COALESCE(new.raw_user_meta_data->>'cpf', '000.000.000-00'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'tipo', 'colaborador')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
