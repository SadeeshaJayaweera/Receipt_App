# 80mm ESC/POS Thermal Printer Operational Guide

## 1. Supported Thermal Printer Hardware

The Juice Receipt Management Platform is natively optimized for standard **80mm (3-inch / 3.125-inch) continuous thermal roll printers**.

### Verified Compatible Hardware Models
- **Epson**: TM-T20II, TM-T20III, TM-T88V, TM-T88VI (USB / Ethernet / Bluetooth).
- **Star Micronics**: TSP143III (USB / LAN / WLAN), TSP654II.
- **Rongta / Xprinter**: RP326, RP80, XP-N160II, XP-Q800 (USB / Virtual COM).
- **Generic 80mm ESC/POS Printers**: Any printer supporting standard 80mm continuous roll receipt paper with ESC/POS emulation.

---

## 2. Printer Driver & Operating System Setup

### macOS Installation (CUPS)
1. Connect printer via USB and power on.
2. Open **System Settings > Printers & Scanners > Add Printer**.
3. Select your thermal printer from the device list.
4. In the **Use** dropdown:
   - For Epson: Select **Epson TM-T20 Raster** driver.
   - For Generic/Xprinter: Select **Generic ESC/POS Printer** or **Select Software > Posiflex / Star Line Mode**.
5. In Options, set default paper size to **Roll Paper 80 x 297mm** (or **Custom 80mm continuous**).

### Windows Installation (Generic / Text Only or Vendor Driver)
1. Install vendor driver package (e.g. Epson Advanced Printer Driver APD5 or Xprinter Driver v7.77).
2. Set Paper Size to **80mm x 297mm** or **Roll Paper 80 x 3276mm**.
3. Under **Device Settings**:
   - Set **Page Cut** to *Receipt [Cut]* at the end of each document.
   - Set **Cash Drawer** to *Open before printing* (if cash drawer kick-out is attached via RJ12).

---

## 3. Browser Print Settings Optimization

To achieve pixel-perfect, zero-margin continuous printing from Chrome, Edge, or Safari:

1. In the browser print dialog (`Cmd + P` or `Ctrl + P`):
   - **Destination**: Choose your installed 80mm thermal printer.
   - **Paper Size**: Choose **80mm Roll Paper** (or 80 x 297mm).
   - **Margins**: Set to **None** (or **Minimum**).
   - **Options**:
     - Check **Background graphics** (ensures dashed lines, dividers, and barcode elements render cleanly).
     - Uncheck **Headers and footers** (removes unwanted URL, date, and page numbers at the top and bottom of the roll).

---

## 4. Software Architecture: Hidden Iframe Printing

The frontend implements silent, pop-up-free thermal printing via `frontend/src/utils/thermalPrinter.js`:

```
User Clicks "Print 80mm" -> Dynamic HTML Generation (calcEngine formatted) -> Injected into Hidden Iframe -> iframe.contentWindow.print() -> Clean tear-off on 80mm roll
```

### Key CSS Rules Applied
- Continuous roll page boundary:
  ```css
  @page {
    size: 80mm auto;
    margin: 0;
  }
  body {
    width: 72mm; /* Printable printable thermal area avoiding edge clipping */
    margin: 0 auto;
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    line-height: 1.25;
  }
  ```

---

## 5. Troubleshooting Runbook

| Problem Symptom | Probable Cause | Corrective Action |
| :--- | :--- | :--- |
| **Receipt prints blank paper** | Thermal paper roll inserted upside down | Open printer lid, flip thermal paper roll so heat-sensitive coated side faces the thermal print head. |
| **Receipt text cut off on right side** | Printable width set to 80mm instead of 72mm | Ensure browser margin is set to **None**. The platform restricts body content to 72mm to prevent mechanical roll margins. |
| **Browser URL/Date printed on receipt** | "Headers and footers" enabled in browser | In print dialog, uncheck **Headers and footers**. |
| **Printer fails to cut paper** | Auto-cutter disabled in driver properties | In OS printer queue settings, set Paper Cut to **Cut after document**. |
| **Printing slow or delayed (5+ seconds)** | Printer offline or CUPS queue stalled | Open OS printer queue, cancel stuck spool jobs, power-cycle the printer, and reprint. |
