export const Format = {
  cep(cep) {
    const digits = String(cep ?? "").replace(/\D/g, "").slice(0, 8);
    return digits.length > 5
      ? `${digits.slice(0, 5)}-${digits.slice(5)}`
      : digits;
  },

  phone(phone) {
    const digits = String(phone ?? "").replace(/\D/g, "");
    return digits.length >= 11
      ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
      : digits;
  },

  date(timestamp) {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  statusLabel(status) {
    const labels = {
      pendente: "Pendente",
      em_rota: "Em rota",
      entregue: "Entregue",
    };
    return labels[status] ?? status;
  },

  statusClass(status) {
    return ["pendente", "em_rota", "entregue"].includes(status)
      ? `status-${status}`
      : "status-pendente";
  },
};
