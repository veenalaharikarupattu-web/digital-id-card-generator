# ID Card Generator Studio

A web portal for **Raghu Engineering College** where students sign in with their college email, fill in a short form, and get a college-branded ID card with a live preview. The card can be saved, downloaded as a PNG, or printed.

**Live demo:** https://id-card-generator-studio.netlify.app/

## Features

- Sign-up and login limited to `@raghuenggcollege.in` email addresses
- Password checklist (8+ characters, capital letter, number, special character)
- Live card preview that updates as you type
- Photo and college logo upload
- Progress ring showing how complete the form is
- Save the card to your account (one card per account, editable later)
- Download the card as a high-resolution PNG
- Print only the card
- Engineering-style design with the college campus photo as background

## Project structure

```
index.html   page structure (login screen and generator screen)
style.css    all styling, including the embedded campus photo
script.js    login, live preview, save, download and print logic
```

## Run it locally

1. Download or clone this repository.
2. Keep `index.html`, `style.css` and `script.js` in the **same folder**.
3. Open `index.html` in a browser.

An internet connection is needed for the Google Fonts and the `html2canvas` library (used for the PNG download).

## Host it for free

- **GitHub Pages:** Settings → Pages → choose the `main` branch and the root folder.
- **Netlify:** drag the folder containing the three files onto the Deploys page.

## Built with

HTML, CSS and JavaScript, plus [html2canvas](https://html2canvas.hertzen.com/) for exporting the card as an image.

## Limitations

This is a prototype.

- Accounts and cards are stored in the browser on the device being used (no server or database). They do not follow a student to another device.
- The login and password checks run in the browser, so they are for demonstration only and are **not secure** for real student data.
- The QR code and barcode on the card are generated from the name and registration number, but they are decorative. They are not scannable codes.
- The card height depends on its content and is not fixed to a standard card size.

## Future ideas

- Backend and database so accounts and cards are stored on a server
- Admin approval and verification by the college office
- Real, scannable QR code and barcode
- Print-ready sheets for many cards at once

## License

Copyright (c) 2026 veenalaharikarupattu-web. All rights reserved.

This source code is provided for viewing only. No permission is granted to copy, modify, distribute or use it without the written permission of the copyright owner. The college name, logo and campus photo belong to their owners.
