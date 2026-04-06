// Style gallery data for the Graphics Creation bot.
// Returned when the model calls the style_galery tool.
// Images are hosted on fal.ai CDN.

/** Main gallery — shown when style_galery is called with no style argument */
export const MAIN_GALLERY = `## Available Styles

| Photorealistic | Flat Illustration | Hand-Drawn Illustration | Cartoon / Caricature | Collage / Mixed Media |
| --- | --- | --- | --- | --- |
| *4 substyles* | *3 substyles* | *5 substyles* | *5 substyles* | *4 substyles* |
| ![Photorealistic](https://v3b.fal.media/files/b/0a9286fe/HoEYKmjzpXo9yTGPhFT7A_YzmNs0MC.jpg) | ![Flat Illustration](https://v3b.fal.media/files/b/0a928703/Dztvk346DhXABv2bnjZBh_A7Hw01xN.jpg) | ![Hand-Drawn Illustration](https://v3b.fal.media/files/b/0a928707/Tddq7X3f9M3e7dpdHrdNG_ylqnF5u1.jpg) | ![Cartoon / Caricature](https://v3b.fal.media/files/b/0a92870b/E4_duU8U42gZb8TE6rK6C_qQIBkyts.jpg) | ![Collage / Mixed Media](https://v3b.fal.media/files/b/0a92870d/p5x_G_E5elsyVvnq0Jrku_kFBVXDzI.jpg) |

| Abstract / Conceptual | Political | Retro / Vintage | Mural / Street Art | Minimalist / Typographic |
| --- | --- | --- | --- | --- |
| *4 substyles* | *5 substyles* | *4 substyles* | *5 substyles* | *3 substyles* |
| ![Abstract / Conceptual](https://v3b.fal.media/files/b/0a928710/w4ZrJYnaw6ZoGClglH-Nw_KFaQuJZO.jpg) | ![Political](https://v3b.fal.media/files/b/0a928715/a3C0HqzyTZYnlx3_WWze__nLeGq2L5.jpg) | ![Retro / Vintage](https://v3b.fal.media/files/b/0a928719/Vm7yGBF3ncBGrDHvKs7q5_Q3OQwAHx.jpg) | ![Mural / Street Art](https://v3b.fal.media/files/b/0a92871c/1VsyR8l3SSpzLWFiJ_uSa_MCiViytT.jpg) | ![Minimalist / Typographic](https://v3b.fal.media/files/b/0a92871f/sULHVH2t2Rkbw0MNfa7--_rDvFjphL.jpg) |`;

/** Substyle galleries — keyed by style name (case-insensitive lookup via getSubstyleGallery) */
const SUBSTYLE_GALLERIES: Record<string, string> = {
  "photorealistic": `## Photorealistic — Substyles

| Editorial portrait | Documentary landscape | Social reportage | Product-object |
| --- | --- | --- | --- |
| ![Editorial portrait](https://v3b.fal.media/files/b/0a92a89f/SR2jvQ_Q19_GKcjXP7k2k_Yzrxm94Y.jpg) | ![Documentary landscape](https://v3b.fal.media/files/b/0a92a8b9/_pZRFRDyNvyWLaeJv5o8B_wqwaZvF6.jpg) | ![Social reportage](https://v3b.fal.media/files/b/0a92a8c3/sa3ueAsHnYsUl2mLZuTRI_5V0FcqPp.jpg) | ![Product-object](https://v3b.fal.media/files/b/0a92a8cd/xzAi8FZWN0daIPtr_ScpC_31TgqBeM.jpg) |`,

  "flat illustration": `## Flat Illustration — Substyles

| Corporate | Iconographic | Geometric |
| --- | --- | --- |
| ![Corporate](https://v3b.fal.media/files/b/0a92a8d9/JIT2-bOXxHCVoYbO49_-m_ktVPQshP.jpg) | ![Iconographic](https://v3b.fal.media/files/b/0a92a8de/vA440NQM2JHk7LzVfruiW_nrKBHWpN.jpg) | ![Geometric](https://v3b.fal.media/files/b/0a92a8e2/c-d_SRd2hyyLKchY4wO58_VM30MCGk.jpg) |`,

  "hand-drawn illustration": `## Hand-Drawn Illustration — Substyles

| Sketch | Watercolor | Ink | Pencil | Woodcut-Engraving |
| --- | --- | --- | --- | --- |
| ![Sketch](https://v3b.fal.media/files/b/0a92ab1b/u_xWKhzi6oYUcdpnYbvPR_E2xe30p7.jpg) | ![Watercolor](https://v3b.fal.media/files/b/0a92ab20/Mn8K6U64o5D9FVkzdFESv_FLnE5AwU.jpg) | ![Ink](https://v3b.fal.media/files/b/0a92ab36/tnAcKcE1ZOT6oSCj6X9FV_QPP68yIx.jpg) | ![Pencil](https://v3b.fal.media/files/b/0a92ab31/-zdU1I5ocan61B5qYX-JB_2MGXM4av.jpg) | ![Woodcut-Engraving](https://v3b.fal.media/files/b/0a92ab35/w5-OSeQIxoHw10jxfb3_z_qJh1652n.jpg) |`,

  "cartoon / caricature": `## Cartoon / Caricature — Substyles

| Comic | Manga | Editorial caricature | Children's cartoon | Adult cartoon |
| --- | --- | --- | --- | --- |
| ![Comic](https://v3b.fal.media/files/b/0a92ab3a/3yQzWSb1XtkjEHjL3Tm3h_d4S6iXCT.jpg) | ![Manga](https://v3b.fal.media/files/b/0a92ab42/suuySCdjFgbYDrQVouiYD_SToYSENs.jpg) | ![Editorial caricature](https://v3b.fal.media/files/b/0a92ab43/IAbmBy1Qr3cJPz7IHZMU2_seZgxrN1.jpg) | ![Children's cartoon](https://v3b.fal.media/files/b/0a92ab48/i_1ZSYGZJHuqX15k9WX2r_bR6ibcwA.jpg) | ![Adult cartoon](https://v3b.fal.media/files/b/0a92ab4b/b53eN_Oi-2p7-Q-M24uy__Ec6FrtCv.jpg) |`,

  "collage / mixed media": `## Collage / Mixed Media — Substyles

| Digital collage | Analog collage | Photomontage | Textured mixed media |
| --- | --- | --- | --- |
| ![Digital collage](https://v3b.fal.media/files/b/0a92ab50/6eEwV5QOAHLExbMUXuP7J_wASoS8Hx.jpg) | ![Analog collage](https://v3b.fal.media/files/b/0a92ab52/Pw0veMh_x2aGpjiSk8BhH_35QlVD2x.jpg) | ![Photomontage](https://v3b.fal.media/files/b/0a92ab55/Iv9yPGEMp4aDIw9j1LqC2_ogBoIgu8.jpg) | ![Textured mixed media](https://v3b.fal.media/files/b/0a92ab5b/SDFcAKxJGpYT9-hlJmJb3_XpqNaCKQ.jpg) |`,

  "abstract / conceptual": `## Abstract / Conceptual — Substyles

| Geometric abstract | Organic-fluid | Minimalist | Generative-pattern |
| --- | --- | --- | --- |
| ![Geometric abstract](https://v3b.fal.media/files/b/0a92ab5d/yNAthwlTy7eQ9mGL-10Dm_4WsluPvE.jpg) | ![Organic-fluid](https://v3b.fal.media/files/b/0a92ab62/DihMcO5UKlzLcdmxn14ck_dobPK1dd.jpg) | ![Minimalist](https://v3b.fal.media/files/b/0a92ab64/J9GDMgPlx82zKTaGpT_4z_o8PU3zXh.jpg) | ![Generative-pattern](https://v3b.fal.media/files/b/0a92ab67/Is-Im5NBv1xRRtmPdf53f_Q1tJojbh.jpg) |`,

  "political": `## Political — Substyles

| Propaganda | Agitprop | Social Realism | Constructivism | Protest Folk-Vernacular |
| --- | --- | --- | --- | --- |
| ![Propaganda](https://v3b.fal.media/files/b/0a92ab6a/_H3C0_etFD6FR5-uJP_5F_P6JQKlVQ.jpg) | ![Agitprop](https://v3b.fal.media/files/b/0a92ab6f/_9LZNhA_QH7wYHm7PpWs9_BfL50r3m.jpg) | ![Social Realism](https://v3b.fal.media/files/b/0a92ab72/9OTaeV88QmpQpD1evSo8d_4DuDVJMz.jpg) | ![Constructivism](https://v3b.fal.media/files/b/0a92ab74/zh5gCK5gvYr0TXuRHM2Qp_xeVrGqiV.jpg) | ![Protest Folk-Vernacular](https://v3b.fal.media/files/b/0a92ab7a/s13E_ZHqxIZCsQEro0CVU_clsrdk9a.jpg) |`,

  "retro / vintage": `## Retro / Vintage — Substyles

| Art Deco | Mid-Century Modern | Psychedelic-Counter-Culture | Swiss International Style |
| --- | --- | --- | --- |
| ![Art Deco](https://v3b.fal.media/files/b/0a92ab8f/9gJMm_yTP59Jwn5bK6QS6_mi06OYR6.jpg) | ![Mid-Century Modern](https://v3b.fal.media/files/b/0a92ab7f/qf535EnGzVm82dwAS5Atx_zeggpjEJ.jpg) | ![Psychedelic-Counter-Culture](https://v3b.fal.media/files/b/0a92ab99/LIEKGrZjCSpGNE8ZloTfm_Q7p4sJML.jpg) | ![Swiss International Style](https://v3b.fal.media/files/b/0a92ab9b/zY20qbG1A0-HGqu7ZD3US_TYhDeYJf.jpg) |`,

  "mural / street art": `## Mural / Street Art — Substyles

| Mexican Muralism | Graffiti | Stencil | Wheat paste | Community mural |
| --- | --- | --- | --- | --- |
| ![Mexican Muralism](https://v3b.fal.media/files/b/0a92aba0/4G9UXSF2ZI7wj82pTQWiX_kgAMyGQD.jpg) | ![Graffiti](https://v3b.fal.media/files/b/0a92aba2/QjPo9ofjVLkGWfxZsvjy1_5MLCJvGf.jpg) | ![Stencil](https://v3b.fal.media/files/b/0a92abb2/WjGFmiUquZwTvZ2GjL0Aq_AaMrxLsG.jpg) | ![Wheat paste](https://v3b.fal.media/files/b/0a92abab/Rho6jz8RaYu__8r8TKK-l_j9sfumkC.jpg) | ![Community mural](https://v3b.fal.media/files/b/0a92abd7/qGjn5Rh8Pg6CdSEtYgxoA_MAhAZp4T.jpg) |`,

  "minimalist / typographic": `## Minimalist / Typographic — Substyles

| Pure typographic | Minimal with visual accent | Monochrome |
| --- | --- | --- |
| ![Pure typographic](https://v3b.fal.media/files/b/0a92abb9/6eghKqfXTX2nIj1ltzn0U_aTYKq11a.jpg) | ![Minimal with visual accent](https://v3b.fal.media/files/b/0a92abe9/FtSC_QKDD8ZJXOof0koqN_RcYzUSjG.jpg) | ![Monochrome](https://v3b.fal.media/files/b/0a92abde/VJmYZyPfLY6wToyFYaEqX_a7bWKl4J.jpg) |`,
};

/**
 * Get the gallery response for a style_galery tool call.
 * If a style argument is provided, returns the substyle gallery.
 * Otherwise returns the main gallery.
 */
export function getStyleGalleryResponse(args: Record<string, unknown>): string {
  const style = args.style as string | undefined;
  if (!style) return MAIN_GALLERY;

  const key = style.toLowerCase().trim();
  // Try exact match first
  if (SUBSTYLE_GALLERIES[key]) return SUBSTYLE_GALLERIES[key];

  // Try partial match (e.g., "Hand-drawn" matches "hand-drawn illustration")
  for (const [k, v] of Object.entries(SUBSTYLE_GALLERIES)) {
    if (k.includes(key) || key.includes(k)) return v;
  }

  // Fallback: return main gallery
  return MAIN_GALLERY;
}
