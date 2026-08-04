import type { Gig, Song } from "./types";

export const canSeeFinance = (role: string) => role === "Administrator";

export const canEdit = (role: string) =>
  role === "Administrator" || role === "Bandleader";

export async function exportGigPdf(gig: Gig, songs: Song[]) {
  // PDF code is loaded only when requested, keeping the mobile app shell small.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  doc.setFillColor(18, 23, 17);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(212, 242, 76);
  doc.setFontSize(22);
  doc.text("KTB / SHOW ADVANCE", 14, 22);
  doc.setTextColor(25, 29, 24);
  doc.setFontSize(18);
  doc.text(gig.title, 14, 49);
  doc.setFontSize(10);
  doc.text(`${gig.date}  •  ${gig.venue}  •  ${gig.address}`, 14, 58);
  doc.text(
    `Soundcheck ${gig.soundcheck}  •  Downbeat ${gig.downbeat}`,
    14,
    65,
  );
  doc.setFontSize(13);
  doc.text("RUN OF SHOW", 14, 79);
  doc.setFontSize(10);
  gig.itinerary.forEach((item, index) =>
    doc.text(`${item.time}   ${item.label}`, 17, 88 + index * 7),
  );
  let y = 96 + gig.itinerary.length * 7;
  doc.setFontSize(13);
  doc.text("SETLIST", 14, y);
  doc.setFontSize(10);
  gig.setlist.forEach((id, index) => {
    const song = songs.find((item) => item.id === id);
    if (song)
      doc.text(
        `${index + 1}. ${song.title}  —  ${song.key}  /  ${song.bpm} BPM`,
        17,
        y + 9 + index * 7,
      );
  });
  y += 16 + gig.setlist.length * 7;
  doc.setFontSize(13);
  doc.text("ADVANCE NOTES", 14, y);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(gig.advance, 178), 17, y + 9);
  doc.save(`KTB-${gig.date}-advance.pdf`);
}
