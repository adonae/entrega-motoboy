export const ViaCepService = {
  normalizarCep(cep) {
    return String(cep ?? "").replace(/\D/g, "");
  },

  async buscar(cep) {
    const cepLimpo = this.normalizarCep(cep);

    if (cepLimpo.length !== 8) {
      throw new Error("Informe um CEP com 8 digitos.");
    }

    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    if (!response.ok) {
      throw new Error("Nao foi possivel consultar o CEP.");
    }

    const data = await response.json();

    if (data.erro) {
      throw new Error("CEP nao encontrado.");
    }

    return {
      cep: data.cep,
      logradouro: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cidade: data.localidade ?? "",
      uf: data.uf ?? "",
    };
  },
};
