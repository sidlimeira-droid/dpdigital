export type UserRole = 'admin' | 'colaborador';

export interface Profile {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  tipo: UserRole;
  data_criacao: string;
}

export interface Document {
  id: string;
  user_id: string;
  tipo_documento: 'contra_cheque' | 'folha_ponto' | 'trabalhista';
  competencia: string;
  arquivo_pdf: string;
  status: 'pendente' | 'assinado';
  data_envio: string;
  data_assinatura?: string;
  profile?: Profile;
}

export interface UserSignature {
  id: string;
  user_id: string;
  assinatura_imagem: string;
  data_cadastro: string;
}

export interface Notification {
  id: string;
  user_id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  data_criacao: string;
}
