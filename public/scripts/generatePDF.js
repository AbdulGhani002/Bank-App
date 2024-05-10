function generatePDF(e) {
    e.preventDefault();
  fetch("/generate-pdf")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      return response.blob();
    })
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "financial_statement.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
