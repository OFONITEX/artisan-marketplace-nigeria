// QR Card Generator for Private Chef Marketplace
// Recreates the exact "SCAN TO HIRE" printable physical card design

export function initQrCardGenerator() {
  const canvas = document.getElementById("qrCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const chefNameInput = document.getElementById("qrChefName");
  const chefPhoneInput = document.getElementById("qrChefPhone");
  const downloadBtn = document.getElementById("downloadQrBtn");

  function drawCard() {
    const width = 400;
    const height = 520;
    canvas.width = width;
    canvas.height = height;

    // Background Card
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 24);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#E5E7EB";
    ctx.stroke();

    // 1. Top Header Banner (Orange #FF7A00)
    ctx.fillStyle = "#FF7A00";
    ctx.beginPath();
    ctx.roundRect(0, 0, width, 55, [24, 24, 0, 0]);
    ctx.fill();

    // Top Banner Text: SCAN TO HIRE
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 18px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "1.5px";
    ctx.fillText("SCAN TO HIRE", width / 2, 35);

    // 2. Outer QR Container Box
    const qrBoxSize = 270;
    const qrX = (width - qrBoxSize) / 2;
    const qrY = 85;

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrBoxSize, qrBoxSize, 20);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#E2E8F0";
    ctx.stroke();

    // 3. Draw Simulated High-Res QR Code Grid
    const qrPadding = 20;
    const innerSize = qrBoxSize - qrPadding * 2;
    const gridSize = 21; // 21x21 QR matrix
    const cellSize = innerSize / gridSize;

    // Deterministic QR pattern generator based on input
    const seedStr = (chefNameInput?.value || "PrivateChefMarketplace") + (chefPhoneInput?.value || "2347030602943");
    
    ctx.fillStyle = "#0D0D11";
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Finder patterns at corners (Top-Left, Top-Right, Bottom-Left)
        const isTL = r < 7 && c < 7;
        const isTR = r < 7 && c >= gridSize - 7;
        const isBL = r >= gridSize - 7 && c < 7;

        if (isTL || isTR || isBL) {
          // Draw Finder Pattern
          const inCenter = (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
                           (r >= 2 && r <= 4 && c >= gridSize - 5 && c <= gridSize - 3) ||
                           (r >= gridSize - 5 && r <= gridSize - 3 && c >= 2 && c <= 4);
          
          if (inCenter || ((r === 0 || r === 6 || r === gridSize - 7 || r === gridSize - 1) && (c < 7 || c >= gridSize - 7)) ||
              ((c === 0 || c === 6 || c === gridSize - 7 || c === gridSize - 1) && (r < 7 || r >= gridSize - 7))) {
            ctx.fillRect(qrX + qrPadding + c * cellSize, qrY + qrPadding + r * cellSize, cellSize, cellSize);
          }
        } else {
          // Random looking data modules based on string hash
          const hashVal = (r * 31 + c * 17 + seedStr.charCodeAt((r + c) % seedStr.length)) % 10;
          if (hashVal < 5) {
            ctx.fillRect(qrX + qrPadding + c * cellSize, qrY + qrPadding + r * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    // 4. Center Circular Logo Badge (Chef Hat Symbol)
    const logoRadius = 26;
    const logoX = width / 2;
    const logoY = qrY + qrBoxSize / 2;

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoRadius + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FF7A00";
    ctx.stroke();

    // Inner Orange Circle Icon
    ctx.fillStyle = "#FF7A00";
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
    ctx.fill();

    // Logo Icon inside circle (Chef Hat / Cutlery SVG draw)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("👨‍🍳", logoX, logoY + 6);

    // 5. Bottom Text Banner
    const chefDisplayName = chefNameInput?.value ? chefNameInput.value : "Private chef";
    
    ctx.fillStyle = "#1E293B";
    ctx.font = "700 20px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Need a", width / 2, 415);

    ctx.fillStyle = "#FF7A00";
    ctx.font = "900 22px 'Inter', sans-serif";
    ctx.fillText(chefDisplayName + "?", width / 2, 445);

    // Subtitle
    ctx.fillStyle = "#64748B";
    ctx.font = "500 12px 'Inter', sans-serif";
    ctx.fillText("Scan code to hire & view menu", width / 2, 475);
  }

  // Initial draw
  drawCard();

  // Event Listeners
  if (chefNameInput) chefNameInput.addEventListener("input", drawCard);
  if (chefPhoneInput) chefPhoneInput.addEventListener("input", drawCard);

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const link = document.createElement("a");
      const filename = (chefNameInput?.value || "private-chef").toLowerCase().replace(/\s+/g, "-");
      link.download = `scan-to-hire-${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  }
}
