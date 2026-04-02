/**
 * ============================================================================
 * SIMULATEUR AAP ADEME 2026
 * « Aides à l'investissement pour la décarbonation du transport
 *   et des services maritimes »
 * ============================================================================
 *
 * GASPE · Localement ancrées. Socialement engagées.
 * Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau
 * Maison de la Mer, Quai de la Fosse, 44000 Nantes
 *
 * Ce simulateur transforme un armateur côtier GASPE (TPE/PME, aucune
 * connaissance en montage de dossier) en candidat crédible face à un
 * instructeur ADEME, en 30 minutes.
 *
 * Cadre réglementaire :
 *   - AAP ouvert le 2 avril 2026, clôture 6 juillet 2026
 *   - Thématique 1 : Décarbonation directe des navires (projet mono-partenaire) (TRL ≥ 7)
 *   - Thématique 2 : Investissements industriels (TRL ≥ 7)
 *   - Régime SA.111726 (LDACEE), SA.111728 (PME), SA.119559 (AFR)
 *   - Mono-partenaire (thématiques 1 et 2)
 *   - Budget min 300k€ (PME), 1M€ (GE)
 *   - Aide max 6M€ par projet et par entreprise
 *
 * Architecture : React 18 (globals) + Recharts + Tailwind CSS (extraites)
 * Zéro CDN, zéro Google Fonts. CSP strict GitHub Pages.
 *
 * Sources scientifiques :
 *   - dimBatt : DNV Pt.6 Ch.2, Corvus Orca, ABB Marine 2022, BNEF 2024
 *   - Émissions : IMO MEPC.1/Circ.684, ENTEC 2005
 *   - Taux LDACEE : CdC AAP ADEME 2026, Annexe 2 (vérifié le 2 avril 2026)
 *
 * Version : 1.0.0 · 2 avril 2026
 * Propulsé par VAIATA Dynamics
 * ============================================================================
 */

const {
  useState,
  useEffect,
  useCallback,
  useMemo
} = React;
const {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell
} = Recharts;

// ============================================================================
// SECTION 1 : CONSTANTES & DONNÉES
// ============================================================================

// --- Palette de couleurs ---
const T = "#1B9AAA"; // Teal GASPE (accent principal)
const D = "#1E2D3D"; // Dark navy (texte, header)
const AC = "#E8634A"; // Coral (alertes, accents chauds)
const LB = "#EAF4F7"; // Light blue (backgrounds)
const W = "#F59E0B"; // Warning amber
const GR = "#10B981"; // Green success
const PU = "#7C3AED"; // Purple (wizard, CTA)

// --- Logos GASPE (base64, extraits en haute résolution) ---
const GASPE_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAmCAYAAACBFtRsAAAllklEQVR42u19aZQd1XXut/c5VXWnHiQhBgEGMxlLmMEykwQanNhMnu3u4BAjx7FNhpcQJyvrrbzn59s3Ky/JWnbihzM4xDwrRjbC3cZ4YB4syUggATIYLBmMbMAMMmjs7jtV1Tl7vx91b/ftVndrQCbJepy1aqm7r7rq1D57+Pa39zkNvDHeGG+MN8Yb441xKIMOz22UoB3fDgxQx9c6/iTSN0TeFplSJqeBlpygk2REUAUGBqiMAVQw0CHLN+T4n9tAVAkDoL4FoPl90AqRHMivlcvKW9u/A+jrsdDlsnKlrYRTjtZnlQN7h9c4Ge5bMEBDfZDX9O5l5b4FQzS0ZYuiUpFDWvdymQ7/Cw6gb8EQAX2YvwVaGTjENR5zHq/zmEKWdLAT7xsCD/WTn/zRcZ/5+/ycN709ypGPxJrsvkUAVZfKzkZjc2VzE5g4gb5BNUNbBg51kf9LRYsyQJ2O5MzP3100s4o9BmGXWuoxke2Fc90UBQbw4JRFoDVSP+xEh42vVV2C6mb8bBjXXJN2Gl15YAAVgv5njNB9g4NmqK9P/qtGvQM0EKW+wSEe6u/3AHDB3z+Y12OiU6E41bC+hYP8PA6COQTqUZFuhZq2QEipQWx3iUv2uGb9RUCfEeCZX/7spZ9ur7yvnjlE5cMaUVQJRHrc4IP541y0wtjoeHHNfe5NCuVC3vo4XdvzSmHtXdeeFv8aNMRgKJPbO7768PFBzp5vgujtHEanicqb4N08eD9bgYiImLi1JAqoFwUjIaIq2OyACbaryvM+rv5CnXtcvPzk4asveHYM5pYHaEZn05LLhd964nRi7mePQJImlA4D1GaA1DSccztDG7zkNXgptPrMuv4zqmNrfABIo1wu821v/ciFUYAr0Iz9YZnbTAagUApDUkWapM1Vj1513i/acgIAe6DKNtQP/46vrjveFEqLbZBfaqLoLJ8kb+XA9BobAURQVZB26KG2TJAZJjSgwEBcUg9s8NOTzj7lkTfftHmDj3l9hei5NnQ4bFCnXOZjfXFZWMr9AwdRXl001buBCyVouuMDu0u7Pwxga6dwXvsclFEhf8ZXHjqqqyf3fhMVriCRZSYIu2EDsDhIqlAooAqoqkrH6xsiIo7ImIhsMIeMOR0gkCGoc6+Q4ccWDT7+kE/dDzb9bO1GVCpupvn3DQ3xEOC96BlRYCsmn4emIUCHQQeJIKLgpAmywauhDZ/z3j1xweCPN/na7tsqRL+aWbZKAOlaLOMowNJc7xF/6Wujh2duM+q3gMM8fNqEuMYmAL9oy2n/BjI4aEDk5w/+JOx2zStsV/fvQWSxCcJeEECs8HHD+2YN6iWLSFO9j0LBBGIDNqZAhhdam1so4KtM0aw/76bHbk931W597I/pZagy6LUYSbYIZ61c0xOw/1MYE6W1YZctwD7zAqVNMcXi6Q744MLrH31uM9A4LBEsUxpZ+LWHLsrPmvPHUH2PCYOCxE2kjRGvXgBSAogI1I7lNFluqoA6BbIAqGBSYgsThEdxEFwK1UttMehbfFZ0b3LTpv/7CLC1rbDQqXXRpw0nTHVVCTVNplu1QwIkRMQgPRKsRxq250GCj9nZx1x6wY2bbjh+CPcOAX4mQ1mHtbhQPxi7Zs1J0lCF8q8Z/iqrJwU1iJBOERinT27R3+/PueH+E2aH9DdBT88/miC4glR60+penw7vFh/XFeIMVA0xGWJioikuJkOAgTjjk6am1b2S1vZ6wHdxaC6LirnPl940958XfuPB88aMQ5UOaYXAClUqFnuvoFxuiTRqDO8MRPa9VIy6JIA4sQaf4mLzNBApymU+DB5VL1z96HvyvbO+bMOgH5IW0uE93sd1HZMXMVMW5aEqUBWddEEzcouImYiZCWQgzrhGTZPhPV7SWKD+DBPmPpMv9Xxt0dc3vAsA8LnP8cx6IQzxJrumkM3YZwdzOSMuhW/UNB3ZI2l1j4f6yAThh8M5c/55uzxxzQkr1+RApNOt71IA8EIQb3XauR3q/Kaec+vrKeVlpzEqIiK5cNWGc21372eZzXvhHfnqiIOKMcwGzB04SvcJt50wZoJPJKIWHoMmdfVpQ4wN85zLf6Bn9lFvXvqtx/5P/HzjmxuJGgcNd1QBIpw7tPYog1l/ykAk4jRz0W28px3plwLE0EaVwq7eE0jlQwAeR6Uy+T8fHGtGJBf++4YlNgo+H0Th6cnoHgfvjWFjxm+bPYICCzKWiM2+cEIVKgIVD3UOUBmXIxMBZOAdfHXYhV09rKqRg2uM0euVypRzNAAYCp72BQ8ZYSoIBOKWgBWaNNW71AfF0klcyleO425fLA+u3Aqk060vQ2aY22ua35R3yp4l8HD7N5C+wUFDRH7RV9dfHHb3/IvN589I9u5SFRVmttkiasfF4MCCgxBEDPUeIh7QzBbIGBAbiPeQNCb1rs31ExERoEbTpsBawJg3qfg5OP7FfQ3tgFjGAQKggeY/GhTz73CN0SwnGruPTiHkFv5PGkrA7174jQ03PXTV4qcOFVpVQHrK7Du6o9mzr7X5/Onx7h2OAZs5FBl7ronyABHSON5JXp4lQy8p0Qh7bSgZVdIioCWIP0ZVjmXQsbZQYADwcbMlR6hCNSp2GwDPp8M7Pvnw1cs2oTwzTDUtpSBIa040UcfZwOYKBy5/zbCg+JQkTVqG3MKMTASITUf2+LC79wi29q+7Tz76eRDd1Tc4aNpYfzKsIUhrflPkjUEIDqPDhLCETJSDpHEkDR+0rGAaA1GlISJ529/eNis4ovfPbZQ7I96700OViQ1PUCoQOIpAxOKbjZ3Oy48N80/h3XOibo+BSYURSGqPIJbTROVsBs40+WIkSUzqU4UqyFqYqMCSxE81m+6Pkhw2bt7cFx+8q1BCheTiW9YdAw37VD1URIiIO2/D1kJVM4/cVgAC+bgJm8sdLRL8Qblc/kzlEKjn8gCoUoHMvSH/JvhkkWuKQL0Bm5Yitpx/GMF7vwVOVzakuSZo4pU0iOMENR9W62IKb9IGpyaEMxEFYWLRFXJ0MtLkbIi8E+IvMPlC0TcbZMOIQNibjAz/4zG5Xz3aNzhopqLhJ2UhHYahE6GDteS93+sbtduNpZo6NTOzVyRKlBPx84zirRyGR2uasoqfYHhs2KS1YRf2zD6Cid6Dcvm+of7+afIRmRqZAGBrIC551ol/jCHymvMnhYpLWZWSFMHLADC0ZUCnNpDWRLtPmP0uUrk8re5VUjGZIk2QuZpCkXySbBPfXOkb9TsTqy+kPmkEjeeSzS+/7FGpKMplmo8Ftvf4eZEvNAshd53tqXEliPo4ly+qd+AgjF1S/36SVP9245VLf3TojBEIFajW7NW2x54pSR0EGc9+iaFQSdPmK8YYy2EwV5I4C3PaxoFqg1z0W/e/7ZJBoLLhoOtMA1BUAMrlT1ZxR2mcIIN347Zmggje+Z83aunHa794/omtlf7kAG//9CnX3XH/3FnmBlOa+1aN49/nMPogR3lKRnavdC8/9+XBP+sTOuCoqy1F7IwgCg4CePGvNJrVv4hiU3WRJezePe1dbLFbY99glGxgmeZG3PuHbO0fIvWsKpMZI4ZPlVjPXzjvgrmbge0YGJgGTQkwRQShMK8a19aMVoc/11Vv1l1gyRbcoWOuYQA9PTBJSXMnNquTC4a2kxZFpSKLbrpnHkf202oQ+GasxPvMXzlXgE/jH6hr/uVuvPj41hXTLHKloluBBNk1CuDupYNrNjiN1sLwX5lcLkxGh79kg8aXN165fG8nrXwIdQ85d/W9p3E+3weDoo9TIQZnVJCIiUpMjO06vGNAw54zqJD7E3UNByVL1hIFAWCNIzYFadY/AJQfAgZ0wqvPPK/2vAmBOxJBjjROBazUKT+1BO/SYZcOv7yPcbQS1/IAaGurIv3q3LUEAMuWLZMKUbwNeBXAqwuvv/fx0rFH3O6T2mn1PS98efOf9zfoz/WA8iYPD8MeTICSTICgSgKw6CvNRvzipy4dPUh123nu4Kb/HYGPDPK5fteoToJvQi5tkDh3grE6C8D2rJOh0sFiAYtZoJRd+yw1CylEbPzzPev/8Jr6r7tQaDvwu6JSgdjcmaRYirgBME/UCBXYUhelcbLO79x5zcZPXbptH8aJCOVymbYuWNAhmWyhj9yxQ4f6l1fnDw6u7kqOfirnirO6SrvX3HX55XHfoBpgCPMzjaaDKRy2eevQ5FbA8Jk+bQJQ0vbiMCssw9Xrm48Ndq98Kc1dQU3zMdvVO1u9g3jf8C75qUvj+yC0tjGsz0AHsufTFBXxgQG0EvmpkxpjsurGFOrq4gbY8ttKs2b93aKbN64c3b3z8WKj3oxG5qbriDzQasPZh/6cOI/NRMN9g4OrH9testuu/XDcriMcTHI6FYhp1WQoKNqg3VKEgQOHuo8Q/er81Q98Eyp9xEwqEzwMVDxEfRdHpVmZ3mVRd6qqiE6XnhPJcLPpD1tReQYHaDu99qIbvtNlw+gSE+atGx3O0Mf4q4HDHFyj8cvEp3/5yKcu3Zb93r43rmTKM+3Y2t+fANjU+bP94+bpC4JD/f3+wlV3/IbJF/sZCFyaCIFYVaFQsWHeqEuedbXq9UMr+v38v79r/dzTu76u0EvSWvVuNnxPo9nYdFKwY0+7WwCfAlBeY49bsCM4assewjykm4nSTuWd3AFQLpe5UqlI2kx+YY1psOGcJHEL3nWusAYUBFex9x/uOXLOL8BH/lKtefXiWx8ZJtU9Hn6vuqSWOh0B8S6oH1Yvoz72oz7U4SeIapnM+j0A38o7DiJn8oD6lhZ2QCxVQAWkAtrrW++lQOUADU+VoEq4ae2r6tRxEAadMItUkaUNwo6cnY7mFfhsXjrFK4lXr75QKp168lkr76yrYSIfHgTiaCKXy8EZKyYO9j5MNHJgEQQAUOhSkXOhLnNG1BEgVZXDgNJmOih7dv94QrF+0jhv1X3zrQ1OBblU0ylAsZnwwgQ2mqU4HigUYMWl9UR+tPmq5Tv3A7mob8ECeumG9V0mj08y0Sm+WRNqNU9k7UkEDgNNqnvv37TiN+7MlOnS3eevvudfkepNm66+ZMxQd5bX5JasXnsaCEcLByfC0DEwJ5TsOW+GwNUu+uaaVz3xzy2azz6w5cHnx1onWvC07QitNJ+CKT5mc4VFcdp0ILETckl10MQzW1vgMDyDbHAGMYNabJBVhbgQnMQgaEMp2EPEL1C3eQHwz140+MA2gX9S4H65sf83Xxoz6oOApxnZrmPrPM7CZ9+HXWJQLjO2DhHml/dzz1aT4tAQhvr7vR184CQThBbeTZqOgAxADrGVeLSTeZwAsSAwNDWA0KRBBrq8a84RxxCRO3iqs6RkAiKmJHa7bwKwur1+0xtIa5Le+JB9Oo+cAU9GD8zwzZonlzy4+Zr31Tswd0f8zCB4NBRcExRKfyJJ0lTrzcEEPLaW1KNWiOIrAdzdWfafymMNEfmLVt3zHpufuwTeKfmUiA216FvlIGCk8Qg5dzNUxyDcJqKftm/zjq/edbwtFRbkosJSZl0mSXo6W+41QQ7EDCXASABPDOP8Ho6KG5ecfclaHlq6bnT3zT/afE0lzQyvX1Au80NXX/LqRd/84b+DeX6u1NWbVquO1Bsw04Qk1CWqLkbWoKMTqG0igmUGiHNszDyywTywOT9j7Amq8gIFwabl3930Q19rrKen9cl1RG6mxd63DtJqc+lYZ4bCQ2RXNDp64E2kFQy1vrrwxjVnBMZ8kq0h7+IJJJNCYK2FB3ZCeU/buDpzkKWt1HzfubXu4R2CMDzWRNGxh9SGogqyAUScsJHNANC3YAENHUgEoSJZUpml7Qgy4aZM6tLhxOkLLa9JmBJKKaBrLQeBqEsNiO1B1HuUjIF4F/jY7c+wqAxg6J/WlKgYXUmk81zS6KB1FWACBYFPqyMbTPP5DQBQGQKhBUcuvOH+E2yvXW6jwntUZLmJzGwoQN5BnBOXjLQweYZCiA3Y2lnGBpeR4jI19qelIz82dMHgR1cN9S/f1nI2wMAAmaG1q129Ost2dV8bdnfN880GfJIIsiIsZS58LEbTPmylSta+o4BPVVu+R0EEYgYH4fHGBseLyEdsd+nH8vZ09dIv3nr9us98cO/+I4nvYLF0Um+LACrhiUnhlJO/8t2qmjyRlWnvpS4ltojI2C5j7DyTz68g4ot9sz7VIguHoRGVLfGeV3dNn4NMT/MSAZLE6uPmoRYMlYwlCoI6ea0DwPy+Pj0giKUpE6yGGfbrnKBm1WimamR91oGLAVSmyq4GBghvXeIkbbCmsajKflpDJhWcSAgiXvbXj1VWqhDJolV3LAqirsWaxgrvCG3WTVU5iEhdOgLSf1733HNJS2n8WSvX9BZzujQqln5XfXqpCWzk4ybSkb1tBc544fYE27MUB4lT9XFDiRkmX3irtYXPEafnLrl57edrhdKmzUR1qNK6/uXVU6677rojk7c8H/XO/l0YXhyUiiUVgcSxinhtNShSi5qlKT3ieEAZq05DPKRZV9+sKRmrNl88i2HOcicecdTCVbd8fjPR9v0n7dLx7/hzJW2CIMcUu+dchx5u7q/hm1QY0Lyqzhbv38zW5Hyjruig2DN7V3AYQFzifNpY8/C1HxtpGfIM85Pp+cJDraargkgpu4vsNwRNjCBeFKGmU1SdqVV4K1Cc5rKgOjBTddKAWWBJIaxTC1ZJp2qmozaHMXMyqIC+/fjvzAu7ej/OjDlJXBdi5rZxkDVE1sRJo/av6/vfeTsAnHfL/WdFCS4zxejdROY8NlT0qddkeLdQ1mfHE6ru4/WRVgjJuvGy9EbgqsMKE/iop/syH/CCcGTPRwA80vbe2669Nt4GfHPh9ffele/BuUGhsFyVLxXofFso5NjaTNnTFOK8qoq220s6GZYpDYiQhSHxSEf3CtlAw+6ezxjD3UtX3vbZdR/HKwolmr57dl8vTSCIBzMXjLFLDgzCcCvaZVHJ1apC1O7xa91bBGStt4WSSaoj3xzx1VXA2KYomdo4FNPxWEQMWHuotQ8lY5HpSpYNbx0aogOLIIE6ho4QU0/W1zSutOqdElFvamkegB9hBqZKCUwMhipPVbjKmvMwJck4fvmZckKiCsnim+68SEmvcHG95a503MiI4OLGKKXulxetvvvTMHZREObPQYhT2JiCJAnSeiJEYOLOTRgZ90VswWFAbGzWOiYekqTaavHI1JMpy9zipAlxtxdi/GIfEmFwkIf63zUM4L6lK1euj4PjbjYkJyrpAivhKfDudBV/gorOIaI853JgYyaED/EpJEmh3ilUWhbTwU4ys7pEXaPqAb4yMcF9ILqZpm34dK2ln1oJVTzS2ohM1w08Je5puRBqRd7xMrUoBxFssWjS+si9aa3x149fffmOLHrMlOPotBBKxHtA0kOBWASoqjDboEmMBADmb9kfxGrVQIzGiVLwMhk+PlNQGg+/IghKXVZjPffMG29c88THPjY5Ude2oOTmO1amw3sfFdJ0ouCFSFm9iLVBeKmNgn5JEu3gGTuMw83EW+t5p9xynC2WPhLkou5keI+0+rrGQJH6FFDptl3F/05kulX9bGaCJAlcoy4KpZYXAdCCOyCYXI44COHjBrxPXhWfbgfIA9qrkBOCUtH4uKmaplndr6uXfdLYqNW9n1u34n27JofzISIPVVq6dq1Zt3x5E8CTAJ7E4OAd547a3rwNZjvnezQs9FhyRzv42dYEs5R4NqnMBXCEij9OVU8w+ajIxPCNhqp2QhgBMZHEdYTds4raXbh46cpb71pHNE0+0pZvMEUpJyOV6KC2UemkQkrLh1gLW+oicWk9bdS/nlZr//DQ1Zc9jXJ5P1sapCNPmhSvchHSev2eNI7/iWBqRGpI9KAsRZnIhiVXp+ZzWVmC5YAiSC3Wek/ObiWbsSWT6l+k3sFA+72UbgTRz6dpNtOHrrz8EQCPzFS7WHbO8m62tl+SxoRWh2lxZ2eOU6lIePOdFxL08haty/sslgJMHBL0RPUJJE3Ui2gGlFr79tRrywMT5wsgNnCN+gtO3D0apw+4JN1qrA4jieGjICS2J3FsLoPKClsq5VWEXFyvJcnoFx666n07JzFIBCI9d/C2o3Hjfem6Fe/aBWTbjIGMDn0E2IXsmuDkTrnujnD2bERGGznWICc2LHDBHI1mfJYy3kOGf1MlqylMeG8RhnplplNj0jkA9k6mUafG+RObFUEMm8/TQbNELQIBrabVtF6rcxKvV5F/i3e+smbjp/p3t7sepr/Jsg6INUWrCbPC0PObfuvRuyZv4X4tDVkzG0jLw3zgucdH1rxtyX0+rq8AE08IsQT4Zk1NLv+WI3p6/8c7Bwc/N9Tf/9LYBvuBgXYE0X1OOWkpdt+CBTTU1ycYGID3jkwwlQdrX3ZKw0KlIufd+N03m1z0cRMGxXR0pNV/NAVUUA/XrI0xR+0oo1k/P8haImNAhmPxyc/hdDD2/tvwO1/a+Fv9UzUg/WTh4L3rikTf07j5+yYIlohL/mYYj9zb6alb20v1optvX2wL3X9FeTTOH7r3Cy5qPDz0Pqq3I2Hf0NCYYc/v6xs7yGLbtZfHAGIAnUWspxZ++voN5qKjvxcVu/7CWPNpTSZT6AoVT6ppUQMbZGQKUDkYGEMMVd9wzcZTCiQqckB7Y5gUMLYJ5d1s+TmAnk5dY0tSrf9848ff+9LBtxFNB7GEAA3PWnl2d++Ja6rVri4qjY4eUj5y5I4dOrRli07oJpk0vwm9WJVKRc5bdcsP89yz2UbRuWm9pmS4k8gmTRoI8sVPqDmysHTwu/9rHdE2AON7D9q4t30qxfhDtc01X3Djd09mogugflKtcaxwpXBuquihfQsWmFckuMxac7lv1jwxzKSO1Akugcb2y6lkVC0zsyE2DLJB3SXJc6lLv5mMJl99+GOXvzjGx//TYCnpLcwB6emRyZXE0KvaTLc90P+u7QDuPG/VHRtyVFuYk+DhrVdXEqCSWWm5nO0H+dp3zgmLXX9nc7mLJE1QjILFPtFvLFp9xxeL6c5f3UtUmxB9Vak8MEBbBwcnKOSrW+ZmvVhYJpUKpfg3PLvklvvuZeJPeIZBmwDuRLmqTfXqMI1xeAARSdYp0VkoVFUTReSa9Zd27Nr7gaS5/ZXa7pwxI9X993edXqJZs2a5rYDHh/v9NP1yun9Ccy2AxS09mIrmVWUg/XHyag3LP+gOa+PVFPtnbMeHCoD8AztfwaW9X2HG2wNrSLynCYm2eGhtVE2hcCXC0vFLvn3nl3Rv86E4qA4/vG1bHURuQtyqVAAoLbz++/lCIe2RXO7sKIyuZdC7pVFX0yp4t5WbRZTg2QST4nsLt7648nunFmbnrrJsIHGVxxPacXhAxlDnxqgWbUtZ4yUExg5r3HwujdPVfji+Zf0nrni2vZPw3BMXHFks5RbYoPB+9v43SPUUGBiGNrkn+tE7v33f385xu+8Z7L98lIA1HYybtuHDohtu6MqXip+z1i52e3Y5FW84jHpNLvwjJr1MoqO+t3zo7juT+vBT6d5478O7f6cKIqnMEOvXAVh4/fcKZpacaEmvYfFhC2JRJ9doGaTQZ/2w39OZX04sFHqwWvA+ZwgossZ89aaUjm675tqDOsRi+2SDaDvJSuWATzVZ1yoWWtUptwyzCBH53iW5uaeYr99WTwmGvH+NO6hi+MCymMKejX2X7Omcq52gXeUyb65cky69cPD7esScq21X8aJ4eK+HwnQaiUBI6lWYXH5xQMH5vgtbikFxw7JzjtnqVn/3eQiNAg7OWZgQBRveezQhOo0odwFULmBjc9JstLeTjt9XPdhEIHVWpTHBQFpQgaJitJQML0oaVYEh7sSpSgQyLBSYOHNXSiD2ZEysztVco75TIY+J2rVq9N4HPnJZtqafyJT8zEWL8oURN2DyxY+yMd3kHCRNoFmkywfdvRen9YY+8wweJWBHBvloQs6x9NZbe0nz14Lp/a4+ClFviQneJQqXkM1FJ8EEf6rNxu+Hpe6noi5+cPnxP3g8WX37i0z8imqjKjE8B6KIcuBYjQSumyl3gg2Dc1T1/cx0hiQJTYanHAbiXNOnSePhR/74Q7umra20VjGTvkzKAT1AQLVOYcv4D3BnJU3mYvXQKnnLWuhy6jqIj+sgkcuomH+HKmChNMPO8QMcgQ+jXEGg/3rmF77wxSeAWjvi2UkhRlr4+VdLBm/5vJWuk8NS6ZikVvUQ4YmtEgrfrAFsrM1HZ7GxZ6l4UGpVgQZgYENVgCIbsOUggKrCxzF8o9puBhoPHiLC1pLJhZTGcl86mm4DQIN9fUKaFQUXXn99D1lcyYGBa7iJTYDi1RaKlMbxw/Fo8242IIhaqGnC6KtC+nRtpLHl8d/r3zGdmAo/+YmYE0/fw4a70tqodngwApTi3TuVTLC4NK9r2dJy+dZlwFj/VXu7LxxfxAF/lgNDLml6AKyZdyFA4ZpNAE2QNTkbhWcT27PFpQicCjH2EOWrGqBODK8AI5KCQdhNTLNtYCEi8M0GJjTKZT1cPioUbNJorJNGsraVC9F0R+1kx0V0mEDHzwGgK41aGEfxep63tbRjHlOS1CJgY7o5CLoP1zNVRMLuLk7q9SNimcUzNCsCldaehh/2f/j7Swdv6yGiv4m6uo5LazVommatHBMgl4M0XMYHZSwGMXOhM2xL3FTfbGC83NU+cSPjycEsQS40ZAP1zdrtye5d//ORj//2z8rlMlO2wARV6r7ltsVEcoGrV8FQGu/2VJC1qiJe1H15w0ffe+MBuDrtBLZQpY1EjcVfG/xyoPreIJdb4BuNzv26pGmqJozYGv2D9KQFmyor+n85hq1bYTlVfcZA/g3AVWF3V49vNOBd6iHK2fbT1u1cCu9SzeyKwNYwGZ5DxHPAbXvSlvILNHWaVkdb1cFxp64qCpCExaJJG/VdSb36pQ0rPvQzzGAcgAepASmBJnXzZt8LqqWpmx1+3WMd1mIpzs86iqfrwvAO4lPgMG1OV1WVRgBNm2KKTZ3RQDrIcKzrf8+qi7/x7adh6L+RNX2mkMv5ZtNLmqJVBGyH8HYiDFU3lnt3KCCNl/G0tahQMKvN5QyHofHOvSCNxpeq1ebKRz7+27vaB0e0WyYuGhqaqxR9lpkiH8dtbJZl9CIadnVx2mh+R3cm946dANk3KUbPFPaz5JbswNqX9ZzGgHj/dRgOxftxFWEl16yJzeeWq+SvWrpy5RfXAfGYkajSg0RPA/ijxTffeleuWPqoBvRuWyjNUefhm03JKs5o92O15KKApO0OH52qtQIAgdsRV6CiCiIxYWhsIW9c6p5J6o0/s0/9+K79nQhDzCqkqiQ6YVMSQQkepNBStYb/iLE067JQD69ColB9HaKXqqClkztmqINMJobL5TJXrvrQw0uv/8af6eyuR8PQ/A4Rzo26uyAuhY8TUfGqom2mlab20Qpt9VaTIRgTGBPlSKEQ519xqbs72btnaP3v9N021vrV3p2HLHkmyvWHXV3vkCQmE1od605SBYV5Fe9qmqarH7jmw9vLL2eM3MF5GFJAaV1luXvbv/zL/UccddxdYVfX+10tKyp2ahFb68N8eE2qs34Aok0d52C1WgoVG4i+f8FXBjdEPebdlO+6BETLbC48kW0AnyQQl4p6URUZl93M6UKmKkzKzGTzOaYgNL7RrPs0viMeHbl+/Uc/ct8YgzhDUmy9N4Y44MCSoKMfShUmDCBJGuaTmCZAx9dpVLdvp+6zlG0YAC6l1yOEqSqZ0EK8si/k6EAMpJWSVASDg2Zdf/9OAF+6+OZb1hvm5WRoMVTfbphOsKWujLEWAVpH1ExQSyYQ2+x0CyKId/BJOqLe/dh597DE6dp4b/zgxk/170a5zFNx0YuOf8vRVt0KuNSpT5OJub0IIYw0iW+Pd+16qKUgwH42bU1T6FKo0pP9/SMXX3nll0yzcRGRzoH3nZksueoIgmLpBLZYcemqVT+9i2ikg8ZUELVrIbsB3Py2b3zj7tmmuNBYLEI+fzGJW2CYjrH5IpRpXHbeQ6WDvaHx4hsZS2S4lfvFEO+eZZH1Lm78IN3RuOfBT/72y2OFyv0wRuxjD7V1iFiIH7MAIoimLmCVOs+O9D8CYm0+5hh9J2mqSexIfKwK/nU/k6Be42aevEsjDmVa6mEGE+v0kFi6atVxGuRPZaL5QbFwOhEdK17mQaWXRLtUNWj1KiiYGiAaVtAOEF70Sfo8xD+B1D/9iv3JM1v7K0lWYR40Yxt/Jo0LBgdnhzBLKfbGGHgVPzZvr0YpsBZenlz3syd/drgOwj7luuuio4+c9y4TBnMljgWGO5hugQkiA/V7CP7edf391enk1jc0fqYxACz51rdOtYmcSNacqlF0smFzgqoeR6qzRXyXqhQIZFobvlRBCRNXwbxL2b4E9c+nteo2pPS4lfqT969YsaujOCn7XUcivXjVqmOMLZ5HgCF12ilP4ZAtm73Pd4cPbLv88hiv91ClJTfdcoohfw5E3OvxSM9GmRBaE2ydhXRr53odlHsoq3JrP/bYQswfHCzN8X4WedPL7ArqKU+AIWOUmNV7SY2J67U6j7q0umfzNZ/e1cmK/Fc//ftAF71vaIgnv+cJK1fmjkrtEblCNIusKUIlR5JEnshmuYIqhFJL1HSJVmOhPXt9bdfTn/zk6IQ1eZ3+lMT/j+PQ4me5zH0LFtD8LVv0UM6P6hscNPO3bNHKFHBqpt+Z6fPX8LcyDvmZg319QgenmIRymV6L7Drlf8iOZVKby5TynCaav54O5fV+7FQ6RIfjZbK/ggRMPMlkfMzv69NKttOuo1/rjXEgsptGhm/I743xxnhj/MeP/wcBEZUDLBW9oAAAAABJRU5ErkJggg==";

// --- Symbole A GASPE (footer / branding) ---
const GASPE_A_COULEUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAZABkAAD/7AARRHVja3kAAQAEAAAAZAAA/9sAQwAGBAUGBQQGBgUGBwcGCAoQCgoJCQoUDg8MEBcUGBgXFBYWGh0lHxobIxwWFiAsICMmJykqKRkfLTAtKDAlKCko/9sAQwEHBwcKCAoTCgoTKBoWGigoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgo/8AAEQgAQABAAwERAAIRAQMRAf/EABsAAQACAwEBAAAAAAAAAAAAAAAGBwQFCAID/8QANxAAAQMDAAcGAwYHAAAAAAAAAQIDBAAFEQYHEiExUYETIkFCcZEyUmEUFRehwdJTVHKDkqKx/8QAGgEBAAMBAQEAAAAAAAAAAAAAAAMEBQYBAv/EAC8RAAICAgADBQcEAwAAAAAAAAABAgMEEQUhMRIVQVFhEyIycaGx4YGRwdEUQvD/2gAMAwEAAhEDEQA/AOqaAUAoBQCgFAKAUAoBQGPcZjNvgvy5StlllBWo/QfrX3CDskox6sjtsjVBzl0RDvxNs/8ALT/8E/uq93Zb5oyu+6PJ/T+zc6M6W2/SF95mGHm3Wkhey6kAqGcZGCeG73qC/EnQk5FvE4hVlNxhva8yQVVLwoBQCgFAVjrdvm9mzsK5PSMf6p/X2rW4bT1tf6HO8ayulEfm/wCP7K2bbccS4pCFKS2naWQM7IyBk9SPetZtLqc+k3trwM2wXR2zXeNOZyeyV3k/Mk/EPao7q1bBwfiTY2RLHtVi8PsdCw5DUuK1IjrC2XUhaFDxB4VzMouLcX1R3UJxsipx6M+tfJ9CgFAYd3uDNrtkmbJOGmUFRHPkB9ScCvuuDskorxIr7o01uyXRHPNwmO3CdIlyTl55ZWrr4eg4dK6SEVCKiuiOEttds3OXVlq6u9GWkaMSHJ7eV3NGFAjeGsd0dfi9qyMzJbtSj/r9zpeGYUVjt2L4/t/3MwTC0O0T7s5X3jPTxSodoQf6fhT131J7TJyfh5Ih9ngYPKz3pfv9Oi/U8nWhHZAbiWdQZTuSC6E4HoAQKd3N85SPO/YR5Qr5fM2lp1lWqW4G5zT0JR8yu+jqRvHtUVnD7I84vZZp43TN6mnH7E2YdbfaS6ytLjaxlK0nII5g1RaaembEZKS3F7R7rw9Kr1vXztJDNnYV3G8Ov48VeVPQb+orTwa9J2M5rjeVtqiPhzf8FcsrSh1CnGw4gKBKCcBQ5VoN8jBi0ntrZJbvpzebi0WUuohx8Y7OMNndy2uPtiq1eLXB76v1NC/il9q7O+yvQ0EGHJnyQxCjuvvK37DYyfU8vU1YlZGK3JlKuqVsuzBbZMIerS8vNbb7sSOr5FLKiPXAx+dVZZ9a6bZqV8EvktyaRpr9ondrKpJkx+1aUoJS6wdtJJ4DhkE/UVLXk12dGVcjh92P8S2vNFtaBWJyw2NLMhxSpDp7VxG1lLZPlA4evM1lZNytntdDp+HYrxqezJ83z+RtL9c2rPaZU5/ellGQn5lcAOpwKihBzkoosZF8aK3ZLwOdpkp6ZLekyFbbzyytZ5kmtmOorSOFsnKyTnLqyY6O6vpV4tDE5UxEYPZKUKaKjs53HOfGq9mWoS7OtmrjcHnfUrHLW/Qklt1XQmlhVwnPyQPI2kNg9d5/5UEs2T+FaL9XAq4vdkm/oTW3WqHa4pYtkdqMkjyp4nmfE9TVWU5Te5PZr1UV0x7NS0UjpHfNIPvSRHuNwkIeZWUFDSy2gY8QB4Y31qVQr7O4o5DKysr2jjZN7XlyJ1qs0meuKH7Zc31PSWx2jK3DlSkeIJ8SD+R+lVMqpR96JscIzZWp1WvbXNfL8FhVTN01GktgjaQxWo816QhlC9vZZWE7RxgZyDw31JXY63tFXKxIZUVCbevQjv4YWP8AjTz/AHU/tqX/ACplHuTH83+/4Juy2hlpDTSQltCQlKRwAG4CqzezXjFRWl0PVD0UBGdIdCrVfZ/2yWZDb2wEKLKwkKxwJyDvqaF8oLSM/J4bTkz7c979DGtWr+12u4MTYkiel9lW0nLqcHmD3eBG6vZZEpLTI6eE00zVkG9r1/BL6gNQUAoBQCgFAKAUAoD/2Q==";
const GASPE_A_BLANC = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAAAAAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAALCAAgACABAREA/8QAGAAAAwEBAAAAAAAAAAAAAAAABQcIAwb/xAAuEAABAwMCAwYGAwAAAAAAAAABAgMEBQYRAAcSITEIEyJRcZEUFRYyQWFigYL/2gAIAQEAAD8AlTXS2rYtzXXGfkW7RZlQYZWG3FspBCVEZxknrjQ24aFU7cqjlOrkJ6DObCVKZeThQBGQfbQzW8KK9OmMRYjSnpD7iWmm0jJWpRwAP2SRq51TqX2f9nqSxJbRIll1tDiEnBffWQXleiUhWP0lI/OllvXR6jvRMp1TsWz6uoRkKaNSlhuK3KaPNPAHCCQDnB/keWp/u+y7is+Qhm5aRKp6l/YpxOUL8+FYyk/0dObsfWH85ul+6Z7WYNJPBG4hyXJUOv8AhJz6qTpzX5uhtK1WA5cEiPVKtSHHGW2REcfLTgPi4cju85SPFn8ddArT3UujdmuVCFYbtJt6DAQlxTlRbMiU6kkgFKB4AM8iMnGRz56VXaL3CvB1r6FumNBZdiPB5+VESQicnGWlJCvtHXODzPljGlhb24t227TEU6h1+dBhIUpSWWVhKQSck9OuuVcWpxaluKKlqOSScknz0Ttu4KtbVR+PoM+RAmcBb71hXCrhPUenIe2tboumtXVKZk3DUpFQkMo7tDj5BUlOc4z5ZJ99f//Z";

// --- Carburants de référence ---
// Sources: IMO GHG Study 2020, ADEME 2024
// Prix MDO ajusté post-crise Iran (fermeture Ormuz fév. 2026)
// Source prix: EIA STEO mars 2026 (Brent ~80 $/bbl horizon H2 2026)
const DEF_FUELS = [{
  id: "mdo",
  l: "MDO (Marine Diesel Oil)",
  cat: "Fossile",
  co2: 3.206,
  price: 850,
  pGr: 4,
  note: "Référence · prix post-crise Iran"
}, {
  id: "b30",
  l: "B30 (blend 30% bio)",
  cat: "Drop-in",
  co2: 2.244,
  price: 1050,
  pGr: 2,
  note: "Sans modification moteur"
}, {
  id: "fame",
  l: "Biodiesel FAME B100",
  cat: "Bio",
  co2: 0.641,
  price: 1500,
  pGr: 1,
  note: "Drop-in diesel, joints à vérifier"
}, {
  id: "hvo",
  l: "HVO (huile hydrogénée)",
  cat: "Bio",
  co2: 0.480,
  price: 1700,
  pGr: 1,
  note: "Drop-in sans modification"
}, {
  id: "elec",
  l: "Électricité batteries",
  cat: "Zéro émission",
  co2: 0,
  price: 180,
  pGr: 2,
  note: "€/MWh · réseau FR",
  unit: "MWh"
}, {
  id: "h2",
  l: "Hydrogène vert (PàC)",
  cat: "e-fuel",
  co2: 0,
  price: 6000,
  pGr: -2,
  note: "Expérimental TRL 7-8",
  adv: true
}, {
  id: "ops",
  l: "OPS (électricité quai)",
  cat: "Zéro quai",
  co2: 0,
  price: 150,
  pGr: 2,
  note: "À quai uniquement",
  unit: "MWh",
  adv: true
}];

// --- Technologies avec TRL (nouveau) ---
// Sources: IMO, DNV, BNEF 2024, ADEME fiches leviers 2025
const TECHS = [{
  id: "helice",
  l: "Hélice optimisée",
  gL: .03,
  gM: .05,
  gH: .08,
  ox: 5,
  retro: "2-4 sem.",
  n: "Tous profils",
  cat: "Efficacité",
  trl: 9
}, {
  id: "antifouling",
  l: "Antifouling avancé",
  gL: .02,
  gM: .03,
  gH: .05,
  ox: 20,
  retro: "1-2 sem.",
  n: "Renouvelable",
  cat: "Efficacité",
  trl: 9
}, {
  id: "slowsteam",
  l: "Réduction vitesse",
  gL: .10,
  gM: .15,
  gH: .25,
  ox: 0,
  retro: "Immédiat",
  n: "Impact temps trajet",
  cat: "Opérationnel",
  trl: 9
}, {
  id: "hybride",
  l: "Hybridation diesel-élect.",
  gL: .15,
  gM: .25,
  gH: .35,
  ox: 40,
  retro: "3-6 mois",
  n: "Charge variable",
  cat: "Électrification",
  trl: 9
}, {
  id: "fullelec",
  l: "Électrification complète",
  gL: .90,
  gM: .95,
  gH: 1.0,
  ox: 30,
  retro: "6-12 mois",
  n: "Zéro émission",
  cat: "Électrification",
  trl: 9
}, {
  id: "bulbe",
  l: "Bulbe d'étrave",
  gL: .03,
  gM: .07,
  gH: .12,
  ox: 0,
  retro: "3-6 sem.",
  n: "> 12 nœuds",
  cat: "Efficacité",
  trl: 9
}, {
  id: "routage",
  l: "Routage marée/courant (IA)",
  gL: .08,
  gM: .15,
  gH: .20,
  ox: 5,
  retro: "1-2 mois",
  n: "Bacs de Seine −17%",
  cat: "Efficacité",
  trl: 8
}, {
  id: "velique",
  l: "Propulsion vélique",
  gL: .05,
  gM: .10,
  gH: .20,
  ox: 10,
  retro: "3-6 mois",
  n: "Routes favorables",
  cat: "Renouvelable",
  trl: 8,
  adv: true
}, {
  id: "h2pac",
  l: "Pile à combustible H₂",
  gL: .80,
  gM: .90,
  gH: .95,
  ox: 50,
  retro: "12+ mois",
  n: "TRL 7-8",
  cat: "Hydrogène",
  trl: 7,
  adv: true
}];

// --- Types de navires avec valeurs par défaut ---
const VT = [{
  id: "bac",
  l: "Bac estuarien / passage d'eau",
  d: {
    loa: 45,
    gt: 400,
    pP: 800,
    pA: 200,
    pPeak: 1200,
    spd: 8,
    fc: 80,
    pTr: 40,
    pMa: 30,
    pQu: 30,
    opD: 300,
    rD: 40,
    cDur: 8,
    qT: 5,
    pax: 0,
    veh: 50,
    opex: 800,
    crew: 500,
    ins: 60,
    dd: 120,
    ddC: 5,
    mktV: 5000,
    rev: 2000,
    debt: 0,
    dspR: 10,
    lifeR: 15
  }
}, {
  id: "navette",
  l: "Navette passagers",
  d: {
    loa: 25,
    gt: 150,
    pP: 600,
    pA: 100,
    pPeak: 800,
    spd: 12,
    fc: 40,
    pTr: 60,
    pMa: 20,
    pQu: 20,
    opD: 300,
    rD: 30,
    cDur: 20,
    qT: 10,
    pax: 200,
    veh: 0,
    opex: 500,
    crew: 400,
    ins: 50,
    dd: 100,
    ddC: 5,
    mktV: 3000,
    rev: 1500,
    debt: 0,
    dspR: 8,
    lifeR: 18
  }
}, {
  id: "ferry",
  l: "Ferry insulaire (ropax)",
  d: {
    loa: 80,
    gt: 3000,
    pP: 8000,
    pA: 1500,
    pPeak: 10000,
    spd: 15,
    fc: 600,
    pTr: 70,
    pMa: 15,
    pQu: 15,
    opD: 330,
    rD: 6,
    cDur: 60,
    qT: 30,
    pax: 600,
    veh: 120,
    opex: 3000,
    crew: 2000,
    ins: 350,
    dd: 800,
    ddC: 5,
    mktV: 25000,
    rev: 12000,
    debt: 5000,
    dspR: 10,
    lifeR: 15
  }
}, {
  id: "lamanage",
  l: "Navire de lamanage",
  d: {
    loa: 18,
    gt: 80,
    pP: 1000,
    pA: 50,
    pPeak: 1500,
    spd: 10,
    fc: 25,
    pTr: 20,
    pMa: 60,
    pQu: 20,
    opD: 340,
    rD: 15,
    cDur: 5,
    qT: 15,
    pax: 0,
    veh: 0,
    opex: 200,
    crew: 250,
    ins: 30,
    dd: 60,
    ddC: 5,
    mktV: 2000,
    rev: 800,
    debt: 0,
    dspR: 7,
    lifeR: 12
  }
}, {
  id: "vedette",
  l: "Vedette rapide",
  d: {
    loa: 20,
    gt: 100,
    pP: 1200,
    pA: 100,
    pPeak: 1600,
    spd: 25,
    fc: 80,
    pTr: 70,
    pMa: 15,
    pQu: 15,
    opD: 280,
    rD: 20,
    cDur: 15,
    qT: 10,
    pax: 100,
    veh: 0,
    opex: 500,
    crew: 350,
    ins: 80,
    dd: 120,
    ddC: 5,
    mktV: 3500,
    rev: 1800,
    debt: 0,
    dspR: 6,
    lifeR: 20
  }
}, {
  id: "ctv",
  l: "Crew Transfer Vessel (EMR)",
  d: {
    loa: 27,
    gt: 200,
    pP: 2500,
    pA: 200,
    pPeak: 3000,
    spd: 25,
    fc: 100,
    pTr: 65,
    pMa: 15,
    pQu: 20,
    opD: 280,
    rD: 4,
    cDur: 45,
    qT: 30,
    pax: 24,
    veh: 0,
    opex: 600,
    crew: 400,
    ins: 80,
    dd: 150,
    ddC: 5,
    mktV: 5000,
    rev: 2500,
    debt: 0,
    dspR: 0,
    lifeR: 20
  }
}, {
  id: "fret",
  l: "Navire de fret côtier (caboteur)",
  d: {
    loa: 40,
    gt: 300,
    pP: 600,
    pA: 150,
    pPeak: 800,
    spd: 9,
    fc: 60,
    pTr: 70,
    pMa: 15,
    pQu: 15,
    opD: 280,
    rD: 2,
    cDur: 120,
    qT: 60,
    pax: 12,
    veh: 0,
    opex: 500,
    crew: 400,
    ins: 70,
    dd: 150,
    ddC: 5,
    mktV: 4000,
    rev: 1500,
    debt: 0,
    dspR: 0,
    lifeR: 25
  }
}];

// --- Régions françaises → Zone AFR automatique ---
// Source: Décret n° 2022-968 du 30 juin 2022 relatif aux zones d'aide à finalité régionale
const REGIONS = [{
  id: "metropole_standard",
  l: "Métropole (hors zone AFR)",
  zone: "hors"
}, {
  id: "bretagne",
  l: "Bretagne",
  zone: "hors"
}, {
  id: "normandie",
  l: "Normandie",
  zone: "hors"
}, {
  id: "paca",
  l: "Provence-Alpes-Côte d'Azur",
  zone: "hors"
}, {
  id: "occitanie",
  l: "Occitanie",
  zone: "hors"
}, {
  id: "nouvelle_aq",
  l: "Nouvelle-Aquitaine",
  zone: "hors"
}, {
  id: "pays_loire",
  l: "Pays de la Loire",
  zone: "hors"
}, {
  id: "hauts_france",
  l: "Hauts-de-France",
  zone: "hors"
}, {
  id: "idf",
  l: "Île-de-France",
  zone: "hors"
}, {
  id: "corse",
  l: "Corse",
  zone: "zoneC"
}, {
  id: "nord_pas_calais",
  l: "Nord (Dunkerque, Boulogne…)",
  zone: "zoneC"
}, {
  id: "guadeloupe",
  l: "Guadeloupe",
  zone: "zoneA"
}, {
  id: "martinique",
  l: "Martinique",
  zone: "zoneA"
}, {
  id: "reunion",
  l: "La Réunion",
  zone: "zoneA"
}, {
  id: "guyane",
  l: "Guyane",
  zone: "zoneA"
}, {
  id: "mayotte",
  l: "Mayotte",
  zone: "zoneA"
}, {
  id: "saint_martin",
  l: "Saint-Martin",
  zone: "zoneA"
}, {
  id: "spm",
  l: "Saint-Pierre-et-Miquelon",
  zone: "zoneA"
}];
// --- Facteurs d'émission SOx/NOx/PM (g/kWh) ---
// Sources: IMO MEPC.1/Circ.684, ENTEC 2005, Cooper & Gustafsson 2004
const EMFACT = {
  mdo: {
    sox: 10.3,
    nox: 9.8,
    pm: 0.38,
    src: "IMO MEPC.1/Circ.684, Tier II"
  },
  b30: {
    sox: 7.2,
    nox: 8.8,
    pm: 0.32,
    src: "Bates et al. 2021, 30% FAME blend"
  },
  fame: {
    sox: 0.8,
    nox: 7.5,
    pm: 0.18,
    src: "Jayaram et al. 2011, B100"
  },
  hvo: {
    sox: 0.5,
    nox: 7.0,
    pm: 0.12,
    src: "Sjöblom 2023, HVO marine"
  },
  elec: {
    sox: 0,
    nox: 0,
    pm: 0,
    src: "Zéro émission directe"
  },
  h2: {
    sox: 0,
    nox: 0,
    pm: 0,
    src: "Pile à combustible, zéro émission directe"
  },
  ops: {
    sox: 0,
    nox: 0,
    pm: 0,
    src: "Alimentation réseau terrestre"
  }
};

// --- Taux d'aide ADEME (LDACEE) ---
// Source: CdC AAP ADEME 2026, Annexe 2, pages 35-36
// Vérifié le 2 avril 2026 · conforme au régime SA.111726
const ADEME_RATES = {
  // Thématique 1 : Décarbonation directe des navires
  navPropre: {
    "-": {
      PE: 50,
      ME: 40,
      GE: 20
    }
  },
  navEmissionNulle: {
    "-": {
      PE: 60,
      ME: 50,
      GE: 30
    }
  },
  amelioContrefactuel: {
    hors: {
      PE: 50,
      ME: 40,
      GE: 30
    },
    zoneC: {
      PE: 55,
      ME: 45,
      GE: 35
    },
    zoneA: {
      PE: 65,
      ME: 55,
      GE: 45
    }
  },
  amelioSans: {
    hors: {
      PE: 25,
      ME: 20,
      GE: 15
    },
    zoneC: {
      PE: 27.5,
      ME: 22.5,
      GE: 17.5
    },
    zoneA: {
      PE: 32.5,
      ME: 27.5,
      GE: 22.5
    }
  },
  etudes: {
    "-": {
      PE: 80,
      ME: 70,
      GE: 60
    }
  },
  // Thématique 2 : Investissements industriels (PME hors zone AFR)
  industrielPME: {
    hors: {
      PE: 20,
      ME: 10,
      GE: 0
    },
    zoneC: {
      PE: 35,
      ME: 25,
      GE: 15
    },
    zoneA: {
      PE: 70,
      ME: 60,
      GE: 50
    }
  }
};

// --- Catégorisation des dépenses ADEME (Guide 2026, type "Investissement") ---
// Source: Guide de catégorisation des dépenses ADEME 2026, page 5
const ADEME_EXPENSE_CATS = [{
  id: "equip_prop",
  l: "Équipements de propulsion bas carbone",
  poste: "Équipements / Investissements",
  sub: "Équipements process",
  ex: "Moteur hybride, pod électrique, pile H₂"
}, {
  id: "equip_stock",
  l: "Systèmes de stockage d'énergie",
  poste: "Équipements / Investissements",
  sub: "Équipements process",
  ex: "Batteries LFP, réservoirs H₂"
}, {
  id: "infra",
  l: "Infrastructure de charge / avitaillement",
  poste: "Équipements / Investissements",
  sub: "Aménagements et constructions",
  ex: "Bornes, câbles, transformateurs"
}, {
  id: "ing_ext",
  l: "Ingénierie réalisée en externe",
  poste: "Équipements / Investissements",
  sub: "Ingénierie d'investissement",
  ex: "MOE, AMO, études, classification"
}, {
  id: "trav_modif",
  l: "Travaux de modification / adaptation",
  poste: "Équipements / Investissements",
  sub: "Autres équipements",
  ex: "Adaptation coque, réseaux bord"
}, {
  id: "certif",
  l: "Certification et classification",
  poste: "Équipements / Investissements",
  sub: "Logiciels et brevets",
  ex: "Bureau Veritas, DNV, essais"
}, {
  id: "moe_int",
  l: "Maîtrise d'œuvre interne",
  poste: "Personnel",
  sub: "MOE réalisée en interne",
  ex: "Plafonné 10% coût total",
  plafond: 0.10
}, {
  id: "formation",
  l: "Formation équipage STCW",
  poste: "Autres dépenses",
  sub: "Prestations extérieures",
  ex: "Plafonné 10% dépenses éligibles",
  plafond: 0.10
}, {
  id: "certif_dep",
  l: "Certification contrôle des dépenses",
  poste: "Autres dépenses",
  sub: "Certification",
  ex: "CAC ou expert-comptable"
}, {
  id: "charges_cx",
  l: "Charges connexes (forfaitaire 20%)",
  poste: "Charges connexes",
  sub: "Forfaitaire",
  ex: "Frais de structure, max 20%",
  plafond: 0.20
}];

// --- DNSH : 6 objectifs de la Taxonomie UE ---
// Source: CdC AAP ADEME 2026, Annexe 1 (art. 17 règlement 2020/852)
const DNSH_AXES = [{
  id: "attenuation",
  l: "Atténuation du changement climatique",
  icon: "🌡️",
  auto: true,
  template: "Le projet réduit les émissions de {co2} tCO₂/an (−{pctCo2}% vs référence), contribuant directement à l'objectif OMI de −20% en 2030."
}, {
  id: "adaptation",
  l: "Adaptation au changement climatique",
  icon: "🌊",
  auto: false,
  template: "Les équipements installés sont conçus pour fonctionner dans les conditions climatiques projetées (hausse du niveau marin, tempêtes plus fréquentes). Durée de vie de conception ≥ 15 ans."
}, {
  id: "eau",
  l: "Utilisation durable de l'eau et ressources marines",
  icon: "💧",
  auto: false,
  template: "Le navire respecte la Convention BWM (gestion des eaux de ballast). Aucun rejet polluant additionnel. Peintures antifouling conformes Convention AFS 2001."
}, {
  id: "circulaire",
  l: "Économie circulaire",
  icon: "♻️",
  auto: false,
  template: "Les batteries LFP sont recyclables à 95% (filière SNAM/Eramet). Possibilité de seconde vie en stockage stationnaire (> 70% capacité résiduelle)."
}, {
  id: "pollution",
  l: "Prévention et réduction de la pollution",
  icon: "🏭",
  auto: true,
  template: "Réduction de {sox} t SOx/an, {nox} t NOx/an et {pm} t PM/an par rapport au scénario de référence."
}, {
  id: "biodiversite",
  l: "Protection de la biodiversité",
  icon: "🐟",
  auto: false,
  template: "La propulsion électrique réduit significativement le bruit sous-marin (< 160 dB re 1 μPa RMS, ref. DNV Silent Class). Antifouling sans biocides toxiques."
}];

// --- Base de cas de référence sourcés ---
// Algorithme matchCases() : score de pertinence 0-100% sur 7 critères
const CASE_DB = [{
  id: "ampere",
  n: "MF Ampere",
  co: "NO",
  yr: 2015,
  vt: ["bac", "ferry"],
  tr: ["full_elec"],
  loa: 80,
  batt: 1000,
  rot: 34,
  nm: 3.2,
  retro: false,
  co2: -570,
  nox: -15,
  s: "Norled 2025; Siemens Energy; EAFO",
  d: "80m alu catamaran, 120 véh./360 pax, Lavik-Oppedal. 1 MWh Corvus. Réduction 95% GES. > 100 000 traversées."
}, {
  id: "ellen",
  n: "E-ferry Ellen",
  co: "DK",
  yr: 2019,
  vt: ["ferry"],
  tr: ["full_elec"],
  loa: 60,
  batt: 4300,
  rot: 7,
  nm: 22,
  retro: false,
  co2: -2520,
  nox: -14.3,
  s: "EU Horizon 2020 #636027; HKF Marineconsult 2022",
  d: "60m, 31 voi./198 pax, Ærø-Fynshav (22 NM). 4,3 MWh Leclanchè. −2 520 tCO₂/an."
}, {
  id: "lamelec",
  n: "LAMELEC",
  co: "FR",
  yr: 2026,
  vt: ["lamanage"],
  tr: ["full_elec"],
  loa: 15,
  batt: 500,
  rot: 15,
  nm: 0,
  retro: false,
  co2: -150,
  nox: 0,
  s: "GASPE/OCEA/VEBRAT; Bpifrance PULSE; CMA CGM Fonds décarb.",
  d: "Premier lamaneur 100% électrique français. OCEA (Les Sables). Loire estuaire."
}, {
  id: "volta1",
  n: "Volta 1 (Anvers)",
  co: "BE",
  yr: 2024,
  vt: ["lamanage"],
  tr: ["full_elec"],
  loa: 28,
  batt: 2782,
  rot: 0,
  nm: 0,
  retro: false,
  co2: -400,
  nox: 0,
  s: "Port of Antwerp-Bruges 2024; Damen Shipyards",
  d: "Remorqueur RSD LTO 2 782 kWh, 70 t traction. Premier remorqueur électrique européen."
}, {
  id: "basto_hybrid",
  n: "Bastø Fosen (hybrides)",
  co: "NO",
  yr: 2021,
  vt: ["ferry"],
  tr: ["hybride"],
  loa: 139,
  batt: 4300,
  rot: 0,
  nm: 5.4,
  retro: true,
  co2: -1500,
  nox: 0,
  s: "Bastø Fosen / Siemens 2022; Bellona",
  d: "2 ferries diesel→hybride + 1 newbuild, Moss-Horten. −75% CO₂, −6 M litres diesel/an."
}, {
  id: "seachange",
  n: "Sea Change",
  co: "US",
  yr: 2024,
  vt: ["navette"],
  tr: ["h2"],
  loa: 21,
  batt: 0,
  rot: 0,
  nm: 0,
  retro: false,
  co2: 0,
  nox: 0,
  s: "ScienceDirect 2025 (IJHE); WETA/CARB",
  d: "75 pax, pile H₂ haute pression. Premier ferry H₂ commercial au monde. SF Bay."
}, {
  id: "dublin_hvo",
  n: "Dublin Port HVO Trial",
  co: "IE",
  yr: 2023,
  vt: ["navette", "fret"],
  tr: ["hvo"],
  loa: 15,
  batt: 0,
  rot: 0,
  nm: 0,
  retro: false,
  co2: -85,
  nox: 0,
  s: "Dublin Port Company 2023; Certa",
  d: "4 pilotines, 100% HVO drop-in. Réduction 80-90% CO₂ sans modification moteur."
}, {
  id: "medstraum",
  n: "MS Medstraum",
  co: "NO",
  yr: 2022,
  vt: ["navette"],
  tr: ["full_elec"],
  loa: 31,
  batt: 1500,
  rot: 0,
  nm: 0,
  retro: false,
  co2: -500,
  nox: 0,
  s: "EU TrAM Project; Kolombus; EAFO",
  d: "31m catamaran, 150 pax, 23 nœuds. Premier ferry rapide 100% électrique."
}, {
  id: "lca_2025",
  n: "Étude LCA ferries électriques",
  co: "INT",
  yr: 2025,
  vt: ["bac", "ferry", "navette"],
  tr: ["full_elec", "hybride"],
  loa: 0,
  batt: 0,
  rot: 0,
  nm: 0,
  retro: false,
  co2: -90,
  nox: 0,
  s: "ScienceDirect, Applied Energy 2025 (peer-reviewed)",
  d: "LCA complète : −90% GES, −75% acidification, −70% PM. CMA ~100 €/tCO₂. LFP préférable."
}, {
  id: "shiftr",
  n: "SHIFTR (Norled)",
  co: "NO",
  yr: 2026,
  vt: ["navette"],
  tr: ["full_elec"],
  loa: 0,
  batt: 0,
  rot: 0,
  nm: 0,
  retro: true,
  co2: -3000,
  nox: 0,
  s: "Business Norway 2024; Norled; DNV",
  d: "Swap batterie autonome. Retrofit Oslofjord : −1 M litres diesel, −3 000 tCO₂/an."
}];
function matchCases(proj) {
  if (!proj) return [];
  const v = proj.v;
  const fuelMix = proj.trajs?.[1]?.fuelMix || {};
  const techs = proj.trajs?.[1]?.techs || {};
  const trTypes = [];
  if (fuelMix.elec > 50 && !fuelMix.mdo) trTypes.push("full_elec");else if (fuelMix.elec > 0) trTypes.push("hybride");
  if (fuelMix.hvo > 0) trTypes.push("hvo");
  if (fuelMix.fame > 0) trTypes.push("fame");
  if (fuelMix.h2 > 0) trTypes.push("h2");
  if (techs.fullelec?.a) trTypes.push("full_elec");
  if (techs.hybride?.a) trTypes.push("hybride");
  return CASE_DB.map(c => {
    let score = 0;
    if (c.vt.includes(v.type)) score += 30;else if (c.vt.some(t => ["bac", "ferry"].includes(t)) && ["bac", "ferry"].includes(v.type)) score += 15;
    const trMatch = c.tr.filter(t => trTypes.includes(t));
    score += trMatch.length * 25;
    if (c.loa > 0 && v.loa > 0) {
      const r = Math.abs(c.loa - v.loa) / Math.max(c.loa, v.loa);
      score += Math.round((1 - r) * 15);
    }
    if (c.batt > 0) {
      const bd = dimBatt(v);
      if (bd.kWh > 0) {
        const r = Math.abs(c.batt - bd.kWh) / Math.max(c.batt, bd.kWh);
        score += Math.round((1 - r) * 10);
      }
    }
    if (c.rot > 0 && v.rD > 0) {
      const r = Math.abs(c.rot - v.rD) / Math.max(c.rot, v.rD);
      score += Math.round((1 - r) * 8);
    }
    return {
      ...c,
      score
    };
  }).filter(c => c.score > 15).sort((a, b) => b.score - a.score).slice(0, 5);
}

// --- Deadline de l'AAP ---
const AAP_DEADLINE = new Date("2026-07-06T23:59:00");
const AAP_PREDEPOT_DEADLINE = new Date("2026-06-22T23:59:00"); // 2 semaines avant clôture

// ============================================================================
// SECTION 2 : MOTEURS DE CALCUL
// ============================================================================

// --- Formatage ---
const fmt = (n, d = 0) => typeof n === "number" ? n.toLocaleString("fr-FR", {
  maximumFractionDigits: d
}) : " - ";
const fK = n => fmt(Math.round(n)) + " k€";
const fPct = n => (n * 100).toFixed(1) + "%";

// --- Jours restants avant la deadline ---
function joursRestants() {
  const now = new Date();
  const diff = AAP_DEADLINE - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// --- Prix carburant avec référencement utilisateur ---
function getFuelPrice(proj, fid) {
  const ref = proj.ref?.fuels?.find(x => x.id === fid);
  return ref ? ref.price : DEF_FUELS.find(x => x.id === fid)?.price || 850;
}
function getFuelCO2(proj, fid) {
  const ref = proj.ref?.fuels?.find(x => x.id === fid);
  return ref ? ref.co2 : DEF_FUELS.find(x => x.id === fid)?.co2 || 3.206;
}

/**
 * dimBatt · Dimensionnement batteries
 * Audité scientifiquement (janvier 2026, 22 cas de référence)
 * 
 * Méthode : max(contrainte énergie, contrainte puissance)
 * - Énergie : eTrip / 0.80 (SoC 10-90%, DNV Pt.6 Ch.2 Sec.1)
 * - Puissance : pPeak / 2C (Corvus Orca ESS, décharge continue 2C)
 * - Chargeur : eTrip / (qT/60) × 1.1 (ABB Marine 2022)
 * - Coût : 450 €/kWh installé maritime (Corvus 2024), 200 €/kW chargeur
 * - Cycles : 5000 à 80% DoD (Preger et al. 2020, LFP)
 */
function dimBatt(v) {
  const pTr = (v.pTr || 60) / 100,
    pMa = (v.pMa || 20) / 100,
    pQu = (v.pQu || 20) / 100;
  const lf = pTr * 1.0 + pMa * Math.min(v.pPeak / v.pP, 1.5) + pQu * (v.pA / v.pP);
  const eTrip = v.pP * v.cDur / 60 * lf;
  const e_energy = eTrip / 0.80;
  const cRate = 2;
  const e_power = v.pPeak / cRate;
  const kWh = Math.max(e_energy, e_power);
  const c = e_power > e_energy ? "puissance" : "énergie";
  const cP = eTrip / (v.qT / 60) * 1.1;
  const dod = Math.min(0.80, eTrip / kWh);
  const eqCyclesAn = v.rD * v.opD * dod / 0.80;
  const lifeCycles = 5000;
  const lifeYrs = Math.max(3, Math.round(lifeCycles / Math.max(1, eqCyclesAn)));
  const costPerKwh = 450; // €/kWh installé maritime (Corvus Orca 2024, incl. BMS/refroid./certif. BV NR 547)
  const costPerKwCharger = 200;
  const gridConnect = cP > 2000 ? 500 : cP > 1000 ? 350 : cP > 500 ? 200 : cP > 200 ? 100 : 50;
  return {
    kWh: Math.round(kWh),
    constraint: c,
    chargePower: Math.round(cP),
    eTrip: Math.round(eTrip),
    loadFactor: Math.round(lf * 1000) / 1000,
    costBatt: Math.round(kWh * costPerKwh / 1000),
    costCharger: Math.round(cP * costPerKwCharger / 1000),
    gridConnect,
    eqCyclesAn: Math.round(eqCyclesAn),
    dod: Math.round(dod * 100),
    lifeCycles,
    lifeYrs,
    cRate,
    costPerKwh
  };
}

/**
 * compute · Moteur CCV (Coût de Cycle de Vie)
 * ISO 15686-5 adapté maritime
 * 
 * Pour chaque trajectoire : calcule CCV actualisé, émissions CO₂ cumulées,
 * en 3 scénarios (base, dégradé, favorable).
 */
function compute(proj) {
  const {
    v,
    p,
    trajs
  } = proj;
  const N = p.dur;
  const r = p.disc / 100;
  const fg = p.fpG / 100;
  const pTr = (v.pTr || 60) / 100,
    pMa = (v.pMa || 20) / 100,
    pQu = (v.pQu || 20) / 100;
  const loadFactor = pTr * 1.0 + pMa * Math.min(v.pPeak / v.pP, 1.5) + pQu * (v.pA / v.pP);
  // fc est en L/h, CO₂ en kgCO₂/kg → conversion par densité MDO 0.85 kg/L
  // Source : ISO 8217:2017, DMB grade, densité typique 0.840-0.890 kg/L
  const MDO_DENSITY = 0.85; // kg/L
  const hFuel = v.fc * MDO_DENSITY * v.opD * (v.rD * v.cDur / 60) / 1000 * loadFactor;
  const battLife = dimBatt(v).lifeYrs;
  return trajs.map((tj, ti) => {
    const at = Object.entries(tj.techs || {}).filter(([, x]) => x?.a);
    const totI = (tj.iC || 0) + (tj.iE || 0) + (tj.iI || 0) + (tj.gridCost || 0);
    const contA = totI * p.cont / 100;
    const calc = cs => {
      let cC = 0,
        cCO2 = 0;
      const yrs = [];
      for (let t = 0; t < N; t++) {
        const yr = p.sy + t;
        const df = Math.pow(1 + r, t);
        const fp = getFuelPrice(proj, "mdo") * Math.pow(1 + fg, t);
        const mix = tj.fuelMix || {
          mdo: 100
        };
        const mixT = Object.values(mix).reduce((a, b) => a + b, 0) || 100;
        let wCO2 = 0,
          wCost = 0;
        Object.entries(mix).forEach(([fid, pct]) => {
          if (pct > 0) {
            const sh = pct / mixT;
            wCO2 += sh * (getFuelCO2(proj, fid) / 3.206);
            wCost += sh * (getFuelPrice(proj, fid) / 850);
          }
        });
        if (wCO2 === 0) {
          wCO2 = 1;
          wCost = 1;
        }
        // Dégradation moteur fossile : +1.5%/an pour la trajectoire de référence
        // Source : MAN Energy Solutions 2023, typical SFOC degradation for medium-speed diesels
        const fossilDeg = ti === 0 ? Math.pow(1.015, t) : 1; // +1.5%/an conso fossile
        let prd = fossilDeg;
        at.forEach(([tid, cfg]) => {
          const tech = TECHS.find(x => x.id === tid);
          if (tech) {
            const depY = (cfg.year || p.sy) - p.sy;
            if (t >= depY) {
              const g = cs === "deg" ? tech.gM * 0.7 : cs === "fav" ? Math.min(tech.gH, 1) : tech.gM;
              prd *= 1 - g;
            }
          }
        });
        const inv = t === 0 ? totI + contA : 0;
        const fC = hFuel * prd;
        const en = fC * wCost * fp / 1000;
        const ex = v.opex + (ti === 0 ? 0 : at.reduce((s, [tid]) => {
          const t2 = TECHS.find(x => x.id === tid);
          return s + (t2 ? t2.ox : 0);
        }, 0));
        const cr = v.crew;
        const insElec = Object.keys(mix).some(k => ["elec", "h2"].includes(k) && mix[k] > 50);
        const insHybrid = Object.keys(mix).some(k => k === "elec" && mix[k] > 10 && mix[k] <= 50);
        const insH2 = Object.keys(mix).some(k => k === "h2" && mix[k] > 10);
        const ins = v.ins + (ti === 0 ? 0 : insH2 ? v.ins * 0.5 : insElec ? v.ins * 0.35 : insHybrid ? v.ins * 0.2 : 0);
        const dd = t > 0 && t % v.ddC === 0 ? v.dd : 0;
        const bt = tj.iE > 0 && battLife > 0 && t > 0 && t % battLife === 0 ? tj.iE * 0.4 : 0;
        const decom = t === N - 1 && tj.iE > 0 ? tj.iE * 0.15 : 0;
        const tot = inv + ex + en + cr + ins + dd + bt + decom;
        const disc = tot / df;
        const co2 = fC * 3.206 * wCO2;
        cC += disc;
        cCO2 += co2;
        yrs.push({
          yr,
          inv,
          ex,
          en,
          cr,
          ins,
          dd: dd + bt + decom,
          tot,
          disc,
          co2,
          cC,
          cCO2
        });
      }
      const rvN = v.mktV * Math.max(0, 1 - N / (v.lifeR + 5)) * 0.7;
      const rvB = cs === "fav" ? (tj.iE || 0) * 0.1 : 0;
      return {
        ccv: cC - (rvN + rvB) / Math.pow(1 + r, N),
        co2: cCO2,
        rv: rvN + rvB,
        yrs
      };
    };
    return {
      name: tj.name,
      idx: ti,
      totI: totI + contA,
      gain: {
        m: 1 - at.reduce((p2, [tid]) => {
          const t2 = TECHS.find(x => x.id === tid);
          return p2 * (1 - (t2?.gM || 0));
        }, 1)
      },
      base: calc("base"),
      deg: calc("deg"),
      fav: calc("fav")
    };
  });
}

/**
 * classifyVessel · Classification ADEME du navire
 * Source: CdC p.10 (définitions RGEC art. 36 ter)
 *
 * - "emissionNulle" : 0% émissions CO₂ au tuyau d'échappement
 * - "propre" : ≥ 25% énergie zéro-CO₂ ou EEDI −10%
 * - "efficace" : plus efficace que le contrefactuel
 */
function classifyVessel(fuelMix) {
  if (!fuelMix) return "efficace";
  const mixT = Object.values(fuelMix).reduce((a, b) => a + b, 0) || 100;
  const zeroPct = Object.entries(fuelMix).filter(([fid]) => ["elec", "h2", "ops"].includes(fid)).reduce((s, [, pct]) => s + pct, 0) / mixT;
  if (zeroPct >= 0.99) return "emissionNulle";
  if (zeroPct >= 0.25) return "propre";
  return "efficace";
}

/**
 * computeAide · Calcul de l'aide ADEME
 * Source: CdC AAP 2026, Annexe 2 + Guide aides d'État
 *
 * aide = min(surcoût × taux_LDACEE, 6 000 000 €)
 * taux dépend de : classification navire, taille entreprise, zone AFR,
 * et existence d'un scénario contrefactuel crédible
 */
function computeAide(proj, surcout) {
  const {
    v
  } = proj;
  const cls = classifyVessel(proj.trajs?.[1]?.fuelMix);
  const size = v.entSize || "PE";
  const zone = v.zoneAFR || "hors";
  let taux = 0;
  let regime = "";
  if (cls === "emissionNulle") {
    taux = ADEME_RATES.navEmissionNulle["-"][size];
    regime = "Navire à émission nulle (Section 6.3, SA.111726)";
  } else if (cls === "propre") {
    taux = ADEME_RATES.navPropre["-"][size];
    regime = "Navire propre (Section 6.3, SA.111726)";
  } else {
    // Efficacité énergétique · taux dépend du contrefactuel
    const hasContref = proj.contrefactuel?.type && proj.contrefactuel?.type !== "aucun";
    if (hasContref) {
      taux = ADEME_RATES.amelioContrefactuel[zone]?.[size] || 30;
      regime = "Efficacité avec contrefactuel (Section 6.4, SA.111726)";
    } else {
      taux = ADEME_RATES.amelioSans[zone]?.[size] || 15;
      regime = "Efficacité sans contrefactuel · taux réduit (Section 6.4, SA.111726)";
    }
  }
  const aide = Math.min(surcout * taux / 100, 6000, surcout); // plafonné à 6M€ ET au surcoût
  return {
    taux,
    aide,
    regime,
    cls,
    plafond: 6000
  };
}

/**
 * computeScoring · Simulation de la notation ADEME (100 points)
 * Source: CdC AAP 2026, pp. 27-29
 *
 * Période de référence thématique 1 : 5 ans
 * Le score est indicatif · l'ADEME classe les projets entre eux
 */
function computeScoring(proj, res, aide) {
  if (!res || res.length < 2) return null;
  const ref = res[0]; // trajectoire actuelle (fossile)
  const alt = res[1]; // trajectoire décarbonée

  // Période de référence : 5 ans
  const refYears = Math.min(5, ref.base.yrs.length);
  const co2Ref = ref.base.yrs.slice(0, refYears).reduce((s, y) => s + y.co2, 0);
  const co2Alt = alt.base.yrs.slice(0, refYears).reduce((s, y) => s + y.co2, 0);
  const co2Evite = co2Ref - co2Alt; // en tonnes

  // 1. Efficacité environnementale (45 pts)
  // Sous-critère 1 (15 pts) : quantité absolue · on ne peut pas comparer aux autres projets,
  // mais on donne une estimation basée sur les ordres de grandeur typiques GASPE
  const typicalMaxCO2 = 5000; // tCO₂ évitées sur 5 ans pour un gros ferry full-elec
  const noteQuantite = Math.min(15, 15 * co2Evite / typicalMaxCO2);

  // Sous-critère 2 (30 pts) : gain relatif
  const gainPct = co2Ref > 0 ? 1 - co2Alt / co2Ref : 0;
  const noteGain = 30 * gainPct;
  const noteEnviron = noteQuantite + noteGain;

  // 2. Efficacité des aides publiques (25 pts)
  const aideTotale = aide || 0; // k€
  const ratioEuroParTonne = co2Evite > 0 ? aideTotale * 1000 / co2Evite : Infinity;
  let noteAide = 0;
  if (ratioEuroParTonne > 200) {
    noteAide = -5; // pénalité éliminatoire
  } else {
    const typicalBest = 30; // €/tCO₂ pour un excellent projet
    noteAide = Math.min(25, 25 * typicalBest / Math.max(1, ratioEuroParTonne));
  }

  // 3. Qualité technico-économique (30 pts) · estimation qualitative
  let noteTechEco = 0;
  // TRL (max 5 pts)
  const minTRL = Math.min(...Object.entries(proj.trajs?.[1]?.techs || {}).filter(([, x]) => x?.a).map(([tid]) => TECHS.find(t => t.id === tid)?.trl || 7));
  noteTechEco += minTRL >= 9 ? 5 : minTRL >= 8 ? 4 : 3;
  // Réduction hors-GES (max 5 pts)
  if (gainPct > 0.5) noteTechEco += 5;else if (gainPct > 0.2) noteTechEco += 3;else noteTechEco += 1;
  // Socle de base pour dossier GASPE structuré (10 pts)
  noteTechEco += 10;
  // Localisation FR (max 10 pts)
  noteTechEco += 10;
  const total = noteEnviron + noteAide + noteTechEco;
  return {
    total: Math.round(total * 10) / 10,
    noteEnviron: Math.round(noteEnviron * 10) / 10,
    noteAide: Math.round(noteAide * 10) / 10,
    noteTechEco: Math.round(noteTechEco * 10) / 10,
    co2Evite: Math.round(co2Evite),
    co2Ref: Math.round(co2Ref),
    co2Alt: Math.round(co2Alt),
    gainPct: Math.round(gainPct * 1000) / 10,
    ratioEuroParTonne: Math.round(ratioEuroParTonne),
    refYears
  };
}

/**
 * computeTRI - Taux de Rentabilité Interne (Newton-Raphson)
 * Exigence CdC p.28 : TRI avant impôts, après toutes aides publiques
 * Calculé sur les cash-flows différentiels (projet décarboné vs contrefactuel)
 */
function computeTRI(cashflows) {
  if (!cashflows || cashflows.length < 2) return null;
  let r = 0.10; // estimation initiale 10%
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0,
      dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const df = Math.pow(1 + r, t);
      npv += cashflows[t] / df;
      dnpv -= t * cashflows[t] / (df * (1 + r));
    }
    if (Math.abs(npv) < 0.01) break;
    if (Math.abs(dnpv) < 1e-10) break;
    r = r - npv / dnpv;
    if (r < -0.5) r = -0.5;
    if (r > 2) r = 2;
  }
  return Math.round(r * 10000) / 100; // en %
}
// ============================================================================
// SECTION 3 : COMPOSANTS UI RÉUTILISABLES
// ============================================================================

// --- Tooltip informatif ---
const Tip = ({
  text
}) => {
  const [o, setO] = useState(false);
  return /*#__PURE__*/React.createElement("span", {
    className: "relative inline-block ml-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.preventDefault();
      e.stopPropagation();
      setO(!o);
    },
    className: "inline-flex items-center justify-center rounded-full text-white font-bold",
    style: {
      width: 16,
      height: 16,
      fontSize: 9,
      backgroundColor: T,
      cursor: "pointer"
    }
  }, "i"), o && /*#__PURE__*/React.createElement("div", {
    className: "absolute z-50 bottom-6 left-0 p-3 rounded-lg text-xs leading-relaxed",
    style: {
      width: 280,
      background: D,
      color: "#e8ecef",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setO(false);
    },
    className: "absolute top-1 right-2 text-xs",
    style: {
      color: "#888"
    }
  }, "\u2715"), text));
};

// --- Input numérique ---
const In = ({
  l,
  v,
  onChange: oc,
  t = "number",
  u,
  n,
  min,
  h
}) => /*#__PURE__*/React.createElement("div", {
  className: "mb-2"
}, /*#__PURE__*/React.createElement("label", {
  className: "block text-xs font-semibold mb-0.5",
  style: {
    color: D
  }
}, l, h && /*#__PURE__*/React.createElement(Tip, {
  text: h
})), /*#__PURE__*/React.createElement("div", {
  className: "flex items-center gap-1"
}, /*#__PURE__*/React.createElement("input", {
  type: t,
  value: v,
  min: min || 0,
  onChange: e => oc(t === "number" ? Math.max(min || 0, parseFloat(e.target.value) || 0) : e.target.value),
  className: "border rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2",
  style: {
    borderColor: "#ddd",
    outlineColor: T
  }
}), u && /*#__PURE__*/React.createElement("span", {
  className: "text-xs shrink-0",
  style: {
    color: "#aaa"
  }
}, u)), n && /*#__PURE__*/React.createElement("p", {
  className: "text-xs mt-0.5",
  style: {
    color: "#bbb"
  }
}, n));

// --- Select ---
const Se = ({
  l,
  v,
  onChange: oc,
  opts,
  h
}) => /*#__PURE__*/React.createElement("div", {
  className: "mb-2"
}, /*#__PURE__*/React.createElement("label", {
  className: "block text-xs font-semibold mb-0.5",
  style: {
    color: D
  }
}, l, h && /*#__PURE__*/React.createElement(Tip, {
  text: h
})), /*#__PURE__*/React.createElement("select", {
  value: v,
  onChange: e => oc(e.target.value),
  className: "border rounded px-2 py-1.5 text-sm w-full",
  style: {
    borderColor: "#ddd"
  }
}, opts.map(o => /*#__PURE__*/React.createElement("option", {
  key: o.v,
  value: o.v
}, o.l))));

// --- Card avec bordure accent ---
const Cd = ({
  title: tl,
  children: ch,
  accent: ac
}) => /*#__PURE__*/React.createElement("div", {
  className: "rounded-xl border p-4 mb-3",
  style: {
    borderColor: ac || "#e5e7eb",
    background: "white",
    borderLeftWidth: ac ? 3 : 1
  }
}, tl && /*#__PURE__*/React.createElement("h3", {
  className: "font-bold text-sm mb-2",
  style: {
    color: D
  }
}, tl), ch);

// --- Stat affichée ---
const St = ({
  l,
  v,
  c = D
}) => /*#__PURE__*/React.createElement("div", {
  className: "text-center p-2"
}, /*#__PURE__*/React.createElement("div", {
  className: "text-lg font-bold",
  style: {
    color: c
  }
}, v), /*#__PURE__*/React.createElement("div", {
  className: "text-xs",
  style: {
    color: "#999"
  }
}, l));

// --- Bannière deadline ---
const DeadlineBanner = () => {
  const j = joursRestants();
  const jpd = Math.max(0, Math.ceil((AAP_PREDEPOT_DEADLINE - new Date()) / (1000 * 60 * 60 * 24)));
  const urgent = j < 30;
  return /*#__PURE__*/React.createElement("div", {
    className: "text-center py-2 px-4 text-sm font-bold",
    style: {
      background: urgent ? AC : T,
      color: "white"
    }
  }, "\u23F1\uFE0F AAP ADEME 2026 \xB7 ", j > 0 ? `J-${j} avant clôture (6 juillet 2026)` : "AAP CLÔTURÉ", jpd > 0 && jpd < j && /*#__PURE__*/React.createElement("span", {
    className: "ml-3 text-xs font-normal opacity-80"
  }, "| Pr\xE9-d\xE9p\xF4t : J-", jpd));
};

// --- Barre de progression 7 étapes ---
const STEPS = [{
  n: 1,
  l: "Mon navire",
  icon: "⚓",
  min: 5
}, {
  n: 2,
  l: "Mon projet",
  icon: "🔋",
  min: 8
}, {
  n: 3,
  l: "Contrefactuel",
  icon: "⚖️",
  min: 3
}, {
  n: 4,
  l: "Gains & DNSH",
  icon: "🌿",
  min: 5
}, {
  n: 5,
  l: "Budget",
  icon: "💰",
  min: 5
}, {
  n: 6,
  l: "Aide & scoring",
  icon: "📊",
  min: 2
}, {
  n: 7,
  l: "Dossier",
  icon: "📄",
  min: 2
}];
const StepBar = ({
  step,
  setStep,
  maxStep
}) => /*#__PURE__*/React.createElement("div", {
  className: "flex items-center gap-1 px-2 py-2 overflow-x-auto",
  style: {
    background: "white",
    borderBottom: "1px solid #e5e7eb"
  }
}, STEPS.map(s => {
  const active = s.n === step;
  const done = s.n < step;
  const locked = s.n > maxStep;
  return /*#__PURE__*/React.createElement("button", {
    key: s.n,
    onClick: () => !locked && setStep(s.n),
    className: "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
    style: {
      background: active ? T : done ? GR + "15" : "transparent",
      color: active ? "white" : done ? GR : locked ? "#ccc" : "#666",
      cursor: locked ? "not-allowed" : "pointer",
      border: active ? "none" : "1px solid " + (done ? GR + "40" : "#e5e7eb"),
      minWidth: 36
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, done ? "\u2713" : s.n), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, s.l), s.min && /*#__PURE__*/React.createElement("span", {
    className: "hidden md:inline text-xs opacity-60"
  }, "~", s.min, "min"));
}));

// ============================================================================
// SECTION 4 : APPLICATION PRINCIPALE · 7 ÉTAPES GUIDÉES
// ============================================================================

/**
 * État initial d'un projet ADEME
 */
function defProjet() {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: "Nouveau projet ADEME",
    upd: new Date().toISOString(),
    thematique: 1,
    // 1 ou 2
    v: {
      type: "bac",
      name: "",
      entSize: "PE",
      zoneAFR: "hors",
      ...VT[0].d
    },
    p: {
      sy: 2026,
      dur: 15,
      disc: 5,
      cont: 12,
      fpG: 4
    },
    ref: {
      fuels: DEF_FUELS.map(f => ({
        id: f.id,
        price: f.price,
        co2: f.co2
      }))
    },
    trajs: [{
      name: "Scénario fossile (référence)",
      fuelMix: {
        mdo: 100
      },
      techs: {},
      iC: 0,
      iE: 0,
      iI: 0,
      gridCost: 0
    }, {
      name: "Projet décarbonation",
      fuelMix: {
        elec: 100
      },
      techs: {},
      iC: 0,
      iE: 0,
      iI: 0,
      gridCost: 0
    }],
    contrefactuel: {
      type: "maintien",
      coutEntretien: 0
    },
    budget: ADEME_EXPENSE_CATS.map(c => ({
      id: c.id,
      montant: 0
    })),
    dnsh: DNSH_AXES.map(a => ({
      id: a.id,
      text: a.template,
      ok: true
    }))
  };
}

// --- Persistance localStorage multi-projet ---
const SK_LIST = "ademe2026_list";
function ldList() {
  try {
    const r = localStorage.getItem(SK_LIST);
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}
function svList(list) {
  try {
    localStorage.setItem(SK_LIST, JSON.stringify(list));
  } catch {/* noop */}
}
function ldProj(id) {
  if (!id) return null;
  try {
    const r = localStorage.getItem("ademe2026:" + id);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}
function svProj(p) {
  try {
    p.upd = new Date().toISOString();
    localStorage.setItem("ademe2026:" + p.id, JSON.stringify(p));
    const list = ldList();
    const entry = {
      id: p.id,
      name: p.name,
      upd: p.upd,
      vType: p.v?.type,
      vName: p.v?.name
    };
    const idx = list.findIndex(x => x.id === p.id);
    if (idx >= 0) list[idx] = entry;else list.push(entry);
    svList(list);
  } catch {/* noop */}
}
function rmProj(id) {
  try {
    localStorage.removeItem("ademe2026:" + id);
    svList(ldList().filter(x => x.id !== id));
  } catch {/* noop */}
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

function App() {
  const [projList, setProjList] = useState([]);
  const [proj, setProj] = useState(null);
  const [step, setStep] = useState(0); // 0 = accueil, 1-7 = étapes
  const [maxStep, setMaxStep] = useState(1);
  const [saved, setSaved] = useState(false);

  // Charger la liste des projets au montage
  useEffect(() => {
    setProjList(ldList());
  }, []);

  // Sauvegarder à chaque modification
  const upd = useCallback(fn => {
    setProj(prev => {
      const next = typeof fn === "function" ? fn(prev) : {
        ...prev,
        ...fn
      };
      svProj(next);
      setProjList(ldList());
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      return next;
    });
  }, []);
  const uV = useCallback((k, val) => upd(p => ({
    ...p,
    v: {
      ...p.v,
      [k]: val
    }
  })), [upd]);
  const uP = useCallback((k, val) => upd(p => ({
    ...p,
    p: {
      ...p.p,
      [k]: val
    }
  })), [upd]);

  // Résultats CCV (mémoïsés)
  const res = useMemo(() => proj ? compute(proj) : null, [proj]);
  const batt = useMemo(() => proj ? dimBatt(proj.v) : null, [proj]);

  // Avancer d'une étape
  const nextStep = () => {
    const ns = Math.min(step + 1, 7);
    setStep(ns);
    setMaxStep(m => Math.max(m, ns));
  };
  const prevStep = () => setStep(Math.max(1, step - 1));

  // --- Ouvrir un projet existant ---
  const openProj = id => {
    const p = ldProj(id);
    if (p) {
      setProj(p);
      setStep(1);
      setMaxStep(7);
    }
  };

  // --- Nouveau projet ---
  const newProj = () => {
    const p = defProjet();
    svProj(p);
    setProj(p);
    setProjList(ldList());
    setStep(1);
    setMaxStep(1);
  };

  // --- Supprimer un projet ---
  const deleteProj = id => {
    if (confirm("Supprimer ce projet ? Cette action est irréversible.")) {
      rmProj(id);
      setProjList(ldList());
      if (proj && proj.id === id) {
        setProj(null);
        setStep(0);
      }
    }
  };

  // --- Retour à la liste ---
  const backToList = () => {
    setProj(null);
    setStep(0);
    setProjList(ldList());
  };

  // ========================
  // ÉCRAN D'ACCUEIL · Liste des projets
  // ========================
  if (step === 0 || !proj) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'DM Sans', system-ui, sans-serif",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a1628 0%, #1B3A4B 50%, #1B9AAA 100%)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col items-center justify-center min-h-screen px-4"
    }, /*#__PURE__*/React.createElement("img", {
      src: GASPE_LOGO,
      alt: "GASPE",
      style: {
        height: 56,
        mixBlendMode: "screen"
      }
    }), /*#__PURE__*/React.createElement("h1", {
      className: "text-2xl font-bold text-white text-center mb-2"
    }, "Simulateur AAP ADEME 2026"), /*#__PURE__*/React.createElement("p", {
      className: "text-center text-sm mb-1",
      style: {
        color: "#a8d8e0"
      }
    }, "D\xE9carbonation du transport et des services maritimes"), /*#__PURE__*/React.createElement("p", {
      className: "text-center text-xs mb-6",
      style: {
        color: "#7ab8c4"
      }
    }, "70 M\u20AC \xB7 Cl\xF4ture le 6 juillet 2026 \xB7 J-", joursRestants()), /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl p-6 w-full max-w-md",
      style: {
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)"
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-center mb-4",
      style: {
        color: "#555"
      }
    }, "Construisez votre pr\xE9-dossier ADEME en 7 \xE9tapes guid\xE9es. 30 minutes pour un dossier structur\xE9, chiffr\xE9 et sourc\xE9."), /*#__PURE__*/React.createElement("a", {
      href: "https://www.b2match.com/e/aap-decarbonation-maritime/sign-up",
      target: "_blank",
      rel: "noopener",
      className: "block w-full mb-4 p-3 rounded-xl text-xs",
      style: {
        background: PU + "15",
        border: "1px solid " + PU + "40",
        textDecoration: "none",
        color: D
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18
      }
    }, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "font-bold",
      style: {
        color: PU
      }
    }, "Webinaire ADEME \xB7 21 avril 2026"), /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#666"
      }
    }, "P\xF4le Mer Bretagne Atlantique \u2022 Pr\xE9sentation de l'AAP"), /*#__PURE__*/React.createElement("div", {
      className: "font-bold mt-1",
      style: {
        color: PU
      }
    }, "\u2192 S'inscrire")))), projList.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "mb-4"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-xs font-bold mb-2",
      style: {
        color: D
      }
    }, "Mes projets (", projList.length, ")"), projList.sort((a, b) => (b.upd || "").localeCompare(a.upd || "")).map(pr => /*#__PURE__*/React.createElement("div", {
      key: pr.id,
      className: "flex items-center gap-2 p-2 rounded-lg mb-1",
      style: {
        background: "#f8f9fb",
        border: "1px solid #e5e7eb"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => openProj(pr.id),
      className: "flex-1 text-left",
      style: {
        background: "none",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-medium",
      style: {
        color: D
      }
    }, pr.name), /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#999"
      }
    }, pr.vName || VT.find(x => x.id === pr.vType)?.l || " - ", " \u2022 ", pr.upd ? new Date(pr.upd).toLocaleDateString("fr-FR") : "")), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        const src = ldProj(pr.id);
        if (src) {
          const dup = {
            ...src,
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            name: src.name + " (copie)"
          };
          svProj(dup);
          setProjList(ldList());
        }
      },
      className: "text-xs px-2 py-1 rounded",
      style: {
        color: T,
        background: T + "10",
        cursor: "pointer"
      }
    }, "\u29C9"), /*#__PURE__*/React.createElement("button", {
      onClick: () => deleteProj(pr.id),
      className: "text-xs px-2 py-1 rounded",
      style: {
        color: AC,
        background: AC + "10",
        cursor: "pointer"
      }
    }, "\u2715")))), /*#__PURE__*/React.createElement("button", {
      onClick: newProj,
      className: "w-full py-3 rounded-xl text-sm font-bold mb-4",
      style: {
        background: T,
        color: "white"
      }
    }, "\u2728 ", projList.length > 0 ? "Nouveau projet" : "Démarrer mon dossier ADEME"), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-center space-y-1",
      style: {
        color: "#999"
      }
    }, /*#__PURE__*/React.createElement("p", null, "Th\xE9matique 1 : D\xE9carbonation directe des navires"), /*#__PURE__*/React.createElement("p", null, "Th\xE9matique 2 : Investissements industriels"), /*#__PURE__*/React.createElement("p", {
      className: "font-medium",
      style: {
        color: T
      }
    }, "Budget min. 300 k\u20AC (PME) \xB7 Aide max 6 M\u20AC"))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mt-6"
    }, /*#__PURE__*/React.createElement("img", {
      src: GASPE_A_COULEUR,
      alt: "",
      style: {
        height: 24,
        borderRadius: 4
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-xs",
      style: {
        color: "#5a8a94"
      }
    }, "Localement ancr\xE9es. Socialement engag\xE9es.")), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-center mt-1",
      style: {
        color: "#3d6a74"
      }
    }, "v1.6.0 \xB7 Propuls\xE9 par ", /*#__PURE__*/React.createElement("a", {
      href: "https://vaiata-dynamics.com/fr/",
      target: "_blank",
      rel: "noopener",
      style: {
        color: "#7ab8c4"
      }
    }, "VAIATA Dynamics"))));
  }

  // ========================
  // INTERFACE PRINCIPALE (7 ÉTAPES)
  // ========================

  // Calculs dérivés pour les étapes avancées
  // Surcoût éligible selon les 4 formules du CdC §1.4.1 (a-d)
  const surcout = (() => {
    if (!res || res.length < 2) return 0;
    const budgetTotal = proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || 0;
    const invDecarb = budgetTotal > 0 ? budgetTotal : res[1]?.totI || 0;
    const disc = proj.p.disc / 100;
    const dur = proj.p.dur;
    const ct = proj.contrefactuel?.type;
    if (ct === "maintien") {
      // Scénario c) : investissement - VAN(entretien actualisé)
      const entAn = proj.contrefactuel?.coutEntretien || 0;
      const vanEntretien = entAn * ((1 - Math.pow(1 + disc, -dur)) / disc);
      return Math.max(0, invDecarb - vanEntretien);
    } else if (ct === "newbuild_fossile") {
      // Scénario a) : investissement décarboné - investissement fossile
      return Math.max(0, invDecarb - (proj.contrefactuel?.coutNewbuild || 0));
    } else if (ct === "reporté") {
      // Scénario b) : investissement - VAN investissement ultérieur
      const delai = proj.contrefactuel?.delaiReport || 3;
      const vanReport = invDecarb / Math.pow(1 + disc, delai);
      return Math.max(0, invDecarb - vanReport);
    } else {
      // Pas de contrefactuel : coûts totaux directs (taux divisés par 2)
      return invDecarb;
    }
  })();
  const aide = computeAide(proj, surcout);
  const scoring = computeScoring(proj, res, aide.aide);

  // Émissions sur 5 ans pour le DNSH
  const emissionsRef5 = res?.[0]?.base?.yrs?.slice(0, 5) || [];
  const emissionsAlt5 = res?.[1]?.base?.yrs?.slice(0, 5) || [];
  const co2Ref5 = emissionsRef5.reduce((s, y) => s + y.co2, 0);
  const co2Alt5 = emissionsAlt5.reduce((s, y) => s + y.co2, 0);
  const hFuelBase = (() => {
    const v = proj.v;
    const pTr = (v.pTr || 60) / 100,
      pMa = (v.pMa || 20) / 100,
      pQu = (v.pQu || 20) / 100;
    const lf = pTr * 1.0 + pMa * Math.min(v.pPeak / v.pP, 1.5) + pQu * (v.pA / v.pP);
    return v.fc * 0.85 * v.opD * (v.rD * v.cDur / 60) / 1000 * lf; // densité MDO 0.85 kg/L
  })();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'DM Sans', system-ui, sans-serif",
      minHeight: "100vh",
      background: "#f5f7f9"
    }
  }, /*#__PURE__*/React.createElement(DeadlineBanner, null), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-3 py-2",
    style: {
      backgroundColor: D,
      color: "white"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 min-w-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: backToList,
    className: "text-xs px-2 py-1 rounded",
    style: {
      background: "rgba(255,255,255,0.15)",
      color: "white",
      cursor: "pointer"
    }
  }, "\u2190 Projets"), /*#__PURE__*/React.createElement("img", {
    src: GASPE_LOGO,
    alt: "GASPE",
    style: {
      height: 22,
      mixBlendMode: "screen"
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: proj.name || "",
    onChange: e => upd({
      name: e.target.value
    }),
    className: "font-bold text-sm truncate",
    style: {
      background: "transparent",
      color: "white",
      border: "none",
      outline: "none",
      width: "100%",
      minWidth: 0
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 shrink-0"
  }, saved && /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: GR
    }
  }, "\u2713 Sauv\xE9"))), /*#__PURE__*/React.createElement(StepBar, {
    step: step,
    setStep: setStep,
    maxStep: maxStep
  }), proj && res && res.length >= 2 && step >= 2 && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-around px-3 py-2 text-xs",
    style: {
      background: D + "08",
      borderBottom: "1px solid #e5e7eb"
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold",
    style: {
      color: GR
    }
  }, "CO\u2082 \xE9vit\xE9"), " ~", fmt(Math.round((res[0].base.co2 - res[1].base.co2) / proj.p.dur)), " t/an"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold",
    style: {
      color: T
    }
  }, "Aide"), " ~", fK(aide.aide)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: scoring?.ratioEuroParTonne > 200 ? AC : "#666"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Ratio"), " ", scoring?.ratioEuroParTonne || "...", " \u20AC/tCO\u2082")), /*#__PURE__*/React.createElement("div", {
    className: "max-w-3xl mx-auto px-3 py-4"
  }, step === 1 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\u2693 \xC9tape 1 \xB7 Mon navire"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "D\xE9crivez le navire concern\xE9 par le projet ADEME. Les donn\xE9es pr\xE9-remplies sont ajustables."), /*#__PURE__*/React.createElement(Cd, {
    title: "Identification"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Nom du navire / liaison",
    v: proj.v.name,
    t: "text",
    onChange: v => uV("name", v)
  }), /*#__PURE__*/React.createElement(Se, {
    l: "Type de navire",
    v: proj.v.type,
    onChange: v => {
      uV("type", v);
      const vt = VT.find(x => x.id === v);
      if (vt) upd(p => ({
        ...p,
        v: {
          ...p.v,
          ...vt.d,
          type: v,
          name: p.v.name,
          entSize: p.v.entSize,
          zoneAFR: p.v.zoneAFR
        }
      }));
    },
    opts: VT.map(v => ({
      v: v.id,
      l: v.l
    }))
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Se, {
    l: "Taille de l'entreprise (UE)",
    v: proj.v.entSize,
    onChange: v => uV("entSize", v),
    opts: [{
      v: "PE",
      l: "Petite entreprise (< 50 pers., < 10 M€ CA)"
    }, {
      v: "ME",
      l: "Moyenne entreprise (< 250 pers., < 50 M€ CA)"
    }, {
      v: "GE",
      l: "Grande entreprise"
    }],
    h: "Au sens de l'annexe I du r\xE8glement UE 651/2014. Inclut les entreprises partenaires et li\xE9es."
  }), /*#__PURE__*/React.createElement(Se, {
    l: "R\xE9gion d'exploitation du navire",
    v: proj.v.region || "metropole_standard",
    onChange: v => {
      const reg = REGIONS.find(r => r.id === v);
      uV("region", v);
      uV("zoneAFR", reg?.zone || "hors");
    },
    opts: REGIONS.map(r => ({
      v: r.id,
      l: r.l + (r.zone === "zoneA" ? " (zone AFR a · taux majorés)" : r.zone === "zoneC" ? " (zone AFR c)" : "")
    })),
    h: "La zone AFR est d\xE9duite automatiquement de votre r\xE9gion. Outre-mer = zone a (taux major\xE9s). Source : D\xE9cret n\xB0 2022-968."
  }))), /*#__PURE__*/React.createElement(Cd, {
    title: "Caract\xE9ristiques techniques"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Longueur (LOA)",
    v: proj.v.loa,
    onChange: v => uV("loa", v),
    u: "m"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Jauge brute",
    v: proj.v.gt,
    onChange: v => uV("gt", v),
    u: "GT"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Puissance propulsion",
    v: proj.v.pP,
    onChange: v => uV("pP", v),
    u: "kW"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Puissance auxiliaire",
    v: proj.v.pA,
    onChange: v => uV("pA", v),
    u: "kW"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Puissance cr\xEAte",
    v: proj.v.pPeak,
    onChange: v => uV("pPeak", v),
    u: "kW"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Vitesse de service",
    v: proj.v.spd,
    onChange: v => uV("spd", v),
    u: "nds"
  }))), /*#__PURE__*/React.createElement(Cd, {
    title: "Profil op\xE9rationnel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Jours d'exploitation/an",
    v: proj.v.opD,
    onChange: v => uV("opD", v),
    u: "j/an"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Rotations/jour",
    v: proj.v.rD,
    onChange: v => uV("rD", v),
    u: "rot/j"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Dur\xE9e travers\xE9e",
    v: proj.v.cDur,
    onChange: v => uV("cDur", v),
    u: "min"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Temps \xE0 quai",
    v: proj.v.qT,
    onChange: v => uV("qT", v),
    u: "min"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Conso carburant",
    v: proj.v.fc,
    onChange: v => uV("fc", v),
    u: "L/h",
    h: "Consommation horaire en litres de MDO au r\xE9gime de transit nominal."
  }), /*#__PURE__*/React.createElement(In, {
    l: "DSP r\xE9siduelle",
    v: proj.v.dspR,
    onChange: v => uV("dspR", v),
    u: "ans"
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-2 grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement(In, {
    l: "% Transit",
    v: proj.v.pTr,
    onChange: v => uV("pTr", v),
    u: "%"
  }), /*#__PURE__*/React.createElement(In, {
    l: "% Man\u0153uvre",
    v: proj.v.pMa,
    onChange: v => uV("pMa", v),
    u: "%"
  }), /*#__PURE__*/React.createElement(In, {
    l: "% Quai",
    v: proj.v.pQu,
    onChange: v => uV("pQu", v),
    u: "%"
  }))), batt && step >= 2 && (Object.keys(proj.trajs?.[1]?.fuelMix || {}).some(k => ["elec", "h2"].includes(k) && proj.trajs[1].fuelMix[k] > 0) || Object.keys(proj.trajs?.[1]?.techs || {}).some(k => ["hybride", "fullelec", "h2pac"].includes(k) && proj.trajs[1].techs[k]?.a)) && /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCCA Pr\xE9-dimensionnement batteries (automatique \xB7 affich\xE9 car projet \xE9lectrique)",
    accent: T
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-4 gap-2"
  }, /*#__PURE__*/React.createElement(St, {
    l: "Capacit\xE9 install\xE9e",
    v: fmt(batt.kWh) + " kWh",
    c: T
  }), /*#__PURE__*/React.createElement(St, {
    l: "Chargeur",
    v: fmt(batt.chargePower) + " kW",
    c: T
  }), /*#__PURE__*/React.createElement(St, {
    l: "Dur\xE9e de vie pack",
    v: batt.lifeYrs + " ans",
    c: T
  }), /*#__PURE__*/React.createElement(St, {
    l: "Co\xFBt estim\xE9 total",
    v: fK(batt.costBatt + batt.costCharger + batt.gridConnect),
    c: T
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: "#999"
    }
  }, "Dimensionn\xE9 par contrainte de ", batt.constraint, ". SoC 10-90% (DNV Pt.6 Ch.2). C-rate 2C (Corvus Orca). 450 \u20AC/kWh install\xE9 maritime (Corvus 2024, incl. BMS/certif. BV).")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setMaxStep(m => Math.max(m, 2));
      nextStep();
    },
    disabled: !proj.v.name,
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: proj.v.name ? T : "#ccc",
      cursor: proj.v.name ? "pointer" : "not-allowed"
    }
  }, !proj.v.name ? "Nommez votre navire pour continuer" : "Suivant"))), step === 2 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\uD83D\uDD0B \xC9tape 2 \xB7 Mon projet de d\xE9carbonation"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "S\xE9lectionnez les technologies et le mix \xE9nerg\xE9tique cible. Le simulateur v\xE9rifie la conformit\xE9 TRL \u2265 7."), /*#__PURE__*/React.createElement(Cd, {
    title: "Th\xE9matique ADEME"
  }, /*#__PURE__*/React.createElement(Se, {
    l: "Th\xE9matique du projet",
    v: proj.thematique,
    onChange: v => upd(p => ({
      ...p,
      thematique: parseInt(v)
    })),
    opts: [{
      v: 1,
      l: "Thématique 1 · Décarbonation directe du navire"
    }, {
      v: 2,
      l: "Thématique 2 · Investissement industriel"
    }]
  })), /*#__PURE__*/React.createElement(Cd, {
    title: "Technologies s\xE9lectionn\xE9es"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#888"
    }
  }, "Cochez les technologies pr\xE9vues. Le TRL doit \xEAtre \u2265 7 en d\xE9but de projet et 9 en fin."), TECHS.map(tech => {
    const active = proj.trajs?.[1]?.techs?.[tech.id]?.a;
    const trlOk = tech.trl >= 7;
    return /*#__PURE__*/React.createElement("div", {
      key: tech.id,
      className: "flex items-center gap-3 p-2 rounded-lg mb-1",
      style: {
        background: active ? T + "15" : "#fafafa",
        border: "1px solid " + (active ? T + "40" : "#eee")
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: !!active,
      onChange: e => upd(p => {
        const ts = {
          ...p.trajs[1].techs
        };
        if (e.target.checked) ts[tech.id] = {
          a: true,
          year: p.p.sy
        };else delete ts[tech.id];
        const trajs = [...p.trajs];
        trajs[1] = {
          ...trajs[1],
          techs: ts
        };
        return {
          ...p,
          trajs
        };
      })
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-sm font-medium",
      style: {
        color: D
      }
    }, tech.l), /*#__PURE__*/React.createElement("span", {
      className: "text-xs px-1.5 py-0.5 rounded font-bold",
      style: {
        background: trlOk ? GR + "20" : AC + "20",
        color: trlOk ? GR : AC,
        fontSize: 10
      }
    }, "TRL ", tech.trl), /*#__PURE__*/React.createElement("span", {
      className: "text-xs px-1.5 py-0.5 rounded",
      style: {
        background: "#f0f0f0",
        color: "#888",
        fontSize: 10
      }
    }, tech.cat)), /*#__PURE__*/React.createElement("div", {
      className: "text-xs mt-0.5",
      style: {
        color: "#999"
      }
    }, "Gain : ", (tech.gL * 100).toFixed(0), "\u2013", (tech.gH * 100).toFixed(0), "% | Retrofit : ", tech.retro, " | ", tech.n)));
  })), /*#__PURE__*/React.createElement(Cd, {
    title: "Mix \xE9nerg\xE9tique cible"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#888"
    }
  }, "R\xE9partition du mix apr\xE8s d\xE9carbonation (en %). Le total doit faire 100%."), DEF_FUELS.filter(f => !f.adv).map(fuel => /*#__PURE__*/React.createElement("div", {
    key: fuel.id,
    className: "flex items-center gap-2 mb-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium w-40",
    style: {
      color: D
    }
  }, fuel.l), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 0,
    max: 100,
    step: 1,
    value: proj.trajs?.[1]?.fuelMix?.[fuel.id] || 0,
    onChange: e => upd(p => {
      const mix = {
        ...p.trajs[1].fuelMix,
        [fuel.id]: parseInt(e.target.value)
      };
      const trajs = [...p.trajs];
      trajs[1] = {
        ...trajs[1],
        fuelMix: mix
      };
      return {
        ...p,
        trajs
      };
    }),
    className: "flex-1"
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 0,
    max: 100,
    step: 1,
    value: proj.trajs?.[1]?.fuelMix?.[fuel.id] || 0,
    onChange: e => upd(p => {
      const mix = {
        ...p.trajs[1].fuelMix,
        [fuel.id]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
      };
      const trajs = [...p.trajs];
      trajs[1] = {
        ...trajs[1],
        fuelMix: mix
      };
      return {
        ...p,
        trajs
      };
    }),
    className: "w-12 text-center border rounded text-sm font-bold",
    style: {
      color: T,
      borderColor: "#ddd"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, "%"))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-2 p-2 rounded",
    style: {
      background: (() => {
        const tot = Object.values(proj.trajs?.[1]?.fuelMix || {}).reduce((a, b) => a + b, 0);
        return tot === 100 ? GR + "15" : AC + "15";
      })()
    }
  }, "Total : ", Object.values(proj.trajs?.[1]?.fuelMix || {}).reduce((a, b) => a + b, 0), "%", Object.values(proj.trajs?.[1]?.fuelMix || {}).reduce((a, b) => a + b, 0) !== 100 && " ⚠️ Doit faire 100%"), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 p-3 rounded-lg",
    style: {
      background: T + "10",
      border: "1px solid " + T + "30"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold",
    style: {
      color: D
    }
  }, "Classification ADEME : "), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold",
    style: {
      color: T
    }
  }, classifyVessel(proj.trajs?.[1]?.fuelMix) === "emissionNulle" ? "🟢 Navire à émission nulle" : classifyVessel(proj.trajs?.[1]?.fuelMix) === "propre" ? "🔵 Navire propre (≥ 25% zéro-CO₂)" : "🟡 Navire plus efficace (amélioration énergétique)"))), /*#__PURE__*/React.createElement(Cd, {
    title: "Investissements pr\xE9visionnels (estimation)"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Coque / structure",
    v: proj.trajs?.[1]?.iC || 0,
    onChange: v => upd(p => {
      const ts = [...p.trajs];
      ts[1] = {
        ...ts[1],
        iC: v
      };
      return {
        ...p,
        trajs: ts
      };
    }),
    u: "k\u20AC",
    h: "Co\xFBts li\xE9s \xE0 la coque, adaptation structurelle"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Syst\xE8me \xE9nerg\xE9tique (batteries, H\u2082)",
    v: proj.trajs?.[1]?.iE || (batt ? batt.costBatt : 0),
    onChange: v => upd(p => {
      const ts = [...p.trajs];
      ts[1] = {
        ...ts[1],
        iE: v
      };
      return {
        ...p,
        trajs: ts
      };
    }),
    u: "k\u20AC",
    h: "Batteries, piles H\u2082, convertisseurs"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Infrastructure charge",
    v: proj.trajs?.[1]?.iI || (batt ? batt.costCharger : 0),
    onChange: v => upd(p => {
      const ts = [...p.trajs];
      ts[1] = {
        ...ts[1],
        iI: v
      };
      return {
        ...p,
        trajs: ts
      };
    }),
    u: "k\u20AC",
    h: "Bornes, c\xE2bles, transformateurs"
  }), /*#__PURE__*/React.createElement(In, {
    l: "Raccordement r\xE9seau",
    v: proj.trajs?.[1]?.gridCost || (batt ? batt.gridConnect : 0),
    onChange: v => upd(p => {
      const ts = [...p.trajs];
      ts[1] = {
        ...ts[1],
        gridCost: v
      };
      return {
        ...p,
        trajs: ts
      };
    }),
    u: "k\u20AC",
    h: "Raccordement ENEDIS / r\xE9seau"
  })), res && res[1] && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 text-xs font-bold",
    style: {
      color: D
    }
  }, "Investissement total estim\xE9 : ", fK(res[1].totI), " (hors contingences)")), (() => {
    const cases = matchCases(proj);
    if (cases.length === 0) return null;
    return /*#__PURE__*/React.createElement(Cd, {
      title: "📚 " + cases.length + " projet(s) de référence similaire(s)",
      accent: T
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-xs mb-2",
      style: {
        color: "#888"
      }
    }, "Projets sourc\xE9s correspondant \xE0 votre profil (matching dynamique sur type, technologie, taille, distance)."), cases.map(c => /*#__PURE__*/React.createElement("div", {
      key: c.id,
      className: "p-2 rounded-lg mb-2 text-xs",
      style: {
        background: LB,
        borderLeft: "3px solid " + (c.score > 60 ? GR : c.score > 40 ? T : W)
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-start mb-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-bold",
      style: {
        color: D
      }
    }, {
      "NO": "🇳🇴",
      "DK": "🇩🇰",
      "FR": "🇫🇷",
      "BE": "🇧🇪",
      "US": "🇺🇸",
      "IE": "🇮🇪",
      "INT": "🌍"
    }[c.co] || "🚢", " ", c.n, " (", c.yr, ")"), /*#__PURE__*/React.createElement("span", {
      className: "px-1.5 py-0.5 rounded font-bold",
      style: {
        background: c.score > 60 ? GR : c.score > 40 ? T : W,
        color: "white",
        fontSize: 9
      }
    }, c.score, "%")), /*#__PURE__*/React.createElement("p", {
      style: {
        color: "#555"
      }
    }, c.d), c.co2 < 0 && /*#__PURE__*/React.createElement("p", {
      className: "mt-1",
      style: {
        color: GR
      }
    }, "Impact mesur\xE9 : ", Math.abs(c.co2), " tCO\u2082/an \xE9vit\xE9es"), /*#__PURE__*/React.createElement("p", {
      className: "mt-1",
      style: {
        color: "#999"
      }
    }, "Source : ", c.s))));
  })(), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: nextStep,
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: T
    }
  }, "Suivant \u2192 Sc\xE9nario contrefactuel"))), step === 3 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\u2696\uFE0F \xC9tape 3 \xB7 Sc\xE9nario contrefactuel"), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-lg mb-4",
    style: {
      background: W + "15",
      border: "1px solid " + W + "30"
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm",
    style: {
      color: D
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "\uD83D\uDCA1 En un mot :"), " le contrefactuel, c'est ce que vous feriez si vous n'aviez PAS cette aide. AdF recommande de preparer une offre et une contre-offre (carbonee vs decarbonee). Identifier un contrefactuel credible double les taux d'aide. Preparez ce dossier en amont : c'est le point le plus chronophage (source : recommandations Armateurs de France).")), /*#__PURE__*/React.createElement(Cd, {
    title: "Type de sc\xE9nario contrefactuel",
    accent: W
  }, [["maintien", "Maintien du navire existant + entretien", "Scénario c) du CdC. Le plus fréquent pour les TPE/PME. Coûts éligibles = investissement décarboné − VAN entretien/réparation actualisée."], ["newbuild_fossile", "Remplacement par un navire diesel neuf", "Scénario a) du CdC. Coûts éligibles = surcoût du navire décarboné par rapport au navire fossile équivalent."], ["reporté", "Même investissement, mais plus tard", "Scénario b) du CdC. Coûts éligibles = différence entre investissement maintenant et VAN de l'investissement ultérieur."], ["aucun", "Pas de contrefactuel identifiable", "⚠️ Les taux d'aide sont divisés par 2. À éviter si possible."]].map(([id, label, desc]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => upd(p => ({
      ...p,
      contrefactuel: {
        ...p.contrefactuel,
        type: id
      }
    })),
    className: "w-full text-left p-3 rounded-lg mb-2 text-sm",
    style: {
      background: proj.contrefactuel?.type === id ? T + "15" : "#fafafa",
      border: "2px solid " + (proj.contrefactuel?.type === id ? T : "transparent")
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold",
    style: {
      color: D
    }
  }, label), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-1",
    style: {
      color: "#888"
    }
  }, desc)))), proj.contrefactuel?.type === "maintien" && /*#__PURE__*/React.createElement(Cd, {
    title: "Co\xFBts d'entretien du sc\xE9nario fossile (sur la dur\xE9e du projet)"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Budget entretien / r\xE9paration annuel estim\xE9",
    v: proj.contrefactuel?.coutEntretien || Math.round(proj.v.mktV * 0.03),
    onChange: v => upd(p => ({
      ...p,
      contrefactuel: {
        ...p.contrefactuel,
        coutEntretien: v
      }
    })),
    u: "k\u20AC/an",
    h: "Estimation par d\xE9faut : 3% de la valeur v\xE9nale/an (RINA 2022, Ship Lifecycle Cost Analysis). Ajustez selon vos donn\xE9es r\xE9elles.",
    n: "Estimation type : " + (proj.v.gt < 200 ? "30-80" : proj.v.gt < 1000 ? "80-200" : "200-500") + " k€/an (source : OPEX benchmarks Clarksons 2024, ajusté proximité). Cliquez pour modifier."
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: "#999"
    }
  }, "VAN entretien actualis\xE9e sur ", proj.p.dur, " ans \xE0 ", proj.p.disc, "% : ", fK((proj.contrefactuel?.coutEntretien || 0) * ((1 - Math.pow(1 + proj.p.disc / 100, -proj.p.dur)) / (proj.p.disc / 100))))), proj.contrefactuel?.type === "newbuild_fossile" && /*#__PURE__*/React.createElement(Cd, {
    title: "Co\xFBt du navire diesel de r\xE9f\xE9rence"
  }, /*#__PURE__*/React.createElement(In, {
    l: "Prix d'un navire fossile \xE9quivalent",
    v: proj.contrefactuel?.coutNewbuild || 0,
    onChange: v => upd(p => ({
      ...p,
      contrefactuel: {
        ...p.contrefactuel,
        coutNewbuild: v
      }
    })),
    u: "k\u20AC",
    h: "Co\xFBt d'acquisition d'un navire neuf de m\xEAme cat\xE9gorie, conforme aux normes UE en vigueur."
  })), /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCCA Impact sur le taux d'aide",
    accent: proj.contrefactuel?.type === "aucun" ? AC : GR
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#888"
    }
  }, "Avec contrefactuel cr\xE9dible"), /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-bold",
    style: {
      color: GR
    }
  }, ADEME_RATES.amelioContrefactuel[proj.v.zoneAFR]?.[proj.v.entSize] || " - ", "%")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#888"
    }
  }, "Sans contrefactuel"), /*#__PURE__*/React.createElement("div", {
    className: "text-xl font-bold",
    style: {
      color: AC
    }
  }, ADEME_RATES.amelioSans[proj.v.zoneAFR]?.[proj.v.entSize] || " - ", "%"))), proj.contrefactuel?.type === "aucun" && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 p-2 rounded text-xs font-bold",
    style: {
      background: AC + "15",
      color: AC
    }
  }, "\u26A0\uFE0F Sans contrefactuel, les taux d'aide sont divis\xE9s par 2. Identifiez un sc\xE9nario de r\xE9f\xE9rence cr\xE9dible.")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: nextStep,
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: T
    }
  }, "Suivant \u2192 Gains environnementaux"))), step === 4 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\uD83C\uDF3F \xC9tape 4 \xB7 Gains environnementaux"), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-lg mb-4",
    style: {
      background: GR + "15",
      border: "1px solid " + GR + "30"
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm",
    style: {
      color: D
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "\uD83D\uDCA1 En un mot :"), " cette \xE9tape mesure les b\xE9n\xE9fices concrets de votre projet pour la plan\xE8te. Les tonnes de CO\u2082 \xE9vit\xE9es et le ratio \u20AC/tCO\u2082 sont les deux chiffres les plus scrut\xE9s par l'instructeur ADEME.")), scoring && /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCCA R\xE9sum\xE9 des gains sur 5 ans",
    accent: GR
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2"
  }, /*#__PURE__*/React.createElement(St, {
    l: "CO\u2082 \xE9vit\xE9 (5 ans)",
    v: fmt(scoring.co2Evite) + " t",
    c: GR
  }), /*#__PURE__*/React.createElement(St, {
    l: "Gain relatif",
    v: scoring.gainPct + "%",
    c: GR
  }), /*#__PURE__*/React.createElement(St, {
    l: "CO\u2082 r\xE9siduel (5 ans)",
    v: fmt(scoring.co2Alt) + " t",
    c: D
  }))), /*#__PURE__*/React.createElement(Cd, {
    title: "R\xE9ductions hors-GES (polluants atmosph\xE9riques)"
  }, (() => {
    const fuelMixAlt = proj.trajs?.[1]?.fuelMix || {};
    const mixT = Object.values(fuelMixAlt).reduce((a, b) => a + b, 0) || 100;
    let soxRef = hFuelBase * EMFACT.mdo.sox / 1e6;
    let noxRef = hFuelBase * EMFACT.mdo.nox / 1e6;
    let pmRef = hFuelBase * EMFACT.mdo.pm / 1e6;
    let soxAlt = 0,
      noxAlt = 0,
      pmAlt = 0;
    const gainTech = res?.[1]?.gain?.m || 0;
    Object.entries(fuelMixAlt).forEach(([fid, pct]) => {
      const ef = EMFACT[fid] || EMFACT.mdo;
      const sh = pct / mixT;
      soxAlt += hFuelBase * (1 - gainTech) * sh * ef.sox / 1e6;
      noxAlt += hFuelBase * (1 - gainTech) * sh * ef.nox / 1e6;
      pmAlt += hFuelBase * (1 - gainTech) * sh * ef.pm / 1e6;
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-3 gap-4 text-center"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#888"
      }
    }, "SOx"), /*#__PURE__*/React.createElement("div", {
      className: "text-lg font-bold",
      style: {
        color: GR
      }
    }, "\u2212", ((soxRef - soxAlt) * 5).toFixed(1), " t"), /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#aaa"
      }
    }, "sur 5 ans")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#888"
      }
    }, "NOx"), /*#__PURE__*/React.createElement("div", {
      className: "text-lg font-bold",
      style: {
        color: GR
      }
    }, "\u2212", ((noxRef - noxAlt) * 5).toFixed(1), " t"), /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#aaa"
      }
    }, "sur 5 ans")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#888"
      }
    }, "PM"), /*#__PURE__*/React.createElement("div", {
      className: "text-lg font-bold",
      style: {
        color: GR
      }
    }, "\u2212", ((pmRef - pmAlt) * 5).toFixed(2), " t"), /*#__PURE__*/React.createElement("div", {
      className: "text-xs",
      style: {
        color: "#aaa"
      }
    }, "sur 5 ans")));
  })()), /*#__PURE__*/React.createElement(Cd, {
    title: "DNSH \xB7 Do No Significant Harm (Annexe 1)",
    accent: PU
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#888"
    }
  }, "Les projets causant un pr\xE9judice important \xE0 l'environnement sont exclus (art. 17, r\xE8glement 2020/852)."), DNSH_AXES.map((axis, i) => /*#__PURE__*/React.createElement("div", {
    key: axis.id,
    className: "p-3 rounded-lg mb-2",
    style: {
      background: "#fafafa",
      border: "1px solid #eee"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold",
    style: {
      color: D
    }
  }, axis.icon, " ", axis.l), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-1 text-xs"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: proj.dnsh?.[i]?.ok !== false,
    onChange: e => upd(p => {
      const dnsh = [...(p.dnsh || [])];
      dnsh[i] = {
        ...dnsh[i],
        ok: e.target.checked
      };
      return {
        ...p,
        dnsh
      };
    })
  }), "Conforme")), /*#__PURE__*/React.createElement("textarea", {
    className: "w-full text-xs p-2 border rounded",
    rows: 3,
    style: {
      borderColor: "#ddd"
    },
    value: proj.dnsh?.[i]?.text || (() => {
      let t = axis.template;
      if (scoring) {
        t = t.replace("{co2}", fmt(Math.abs(scoring.co2Evite / 5)));
        t = t.replace("{pctCo2}", scoring.gainPct);
      }
      const mixAlt = proj.trajs?.[1]?.fuelMix || {};
      const mixT = Object.values(mixAlt).reduce((a, b) => a + b, 0) || 100;
      const gTech = res?.[1]?.gain?.m || 0;
      const soxR = hFuelBase * EMFACT.mdo.sox / 1e6;
      let soxA = 0,
        noxA = 0,
        pmA = 0;
      Object.entries(mixAlt).forEach(([fid, pct]) => {
        const ef = EMFACT[fid] || EMFACT.mdo;
        const sh = pct / mixT;
        soxA += hFuelBase * (1 - gTech) * sh * ef.sox / 1e6;
        noxA += hFuelBase * (1 - gTech) * sh * ef.nox / 1e6;
        pmA += hFuelBase * (1 - gTech) * sh * ef.pm / 1e6;
      });
      t = t.replace("{sox}", (soxR - soxA).toFixed(1));
      t = t.replace("{nox}", (hFuelBase * EMFACT.mdo.nox / 1e6 - noxA).toFixed(1));
      t = t.replace("{pm}", (hFuelBase * EMFACT.mdo.pm / 1e6 - pmA).toFixed(2));
      return t;
    })(),
    onChange: e => upd(p => {
      const dnsh = [...(p.dnsh || [])];
      dnsh[i] = {
        ...dnsh[i],
        text: e.target.value
      };
      return {
        ...p,
        dnsh
      };
    })
  }), axis.id === "circulaire" && /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Fournisseur recyclage batteries (ex: SNAM, Eramet...)",
    className: "w-full text-xs p-2 border rounded mt-1",
    style: {
      borderColor: "#ddd"
    },
    value: proj.dnsh?.[i]?.fournisseur || "",
    onChange: e => upd(p => {
      const d = [...(p.dnsh || [])];
      d[i] = {
        ...d[i],
        fournisseur: e.target.value
      };
      return {
        ...p,
        dnsh: d
      };
    })
  }), axis.id === "biodiversite" && /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Certification bruit vis\xE9e (ex: DNV Silent Class, BV NR 614...)",
    className: "w-full text-xs p-2 border rounded mt-1",
    style: {
      borderColor: "#ddd"
    },
    value: proj.dnsh?.[i]?.certification || "",
    onChange: e => upd(p => {
      const d = [...(p.dnsh || [])];
      d[i] = {
        ...d[i],
        certification: e.target.value
      };
      return {
        ...p,
        dnsh: d
      };
    })
  }), axis.id === "eau" && /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Type antifouling (ex: silicone sans biocide, cuivre r\xE9duit...)",
    className: "w-full text-xs p-2 border rounded mt-1",
    style: {
      borderColor: "#ddd"
    },
    value: proj.dnsh?.[i]?.antifouling || "",
    onChange: e => upd(p => {
      const d = [...(p.dnsh || [])];
      d[i] = {
        ...d[i],
        antifouling: e.target.value
      };
      return {
        ...p,
        dnsh: d
      };
    })
  })))), /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83C\uDF0D Empreinte Projet ADEME (niveau 1)",
    accent: T
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2",
    style: {
      color: "#555"
    }
  }, "Le CdC exige une analyse environnementale de niveau 1 selon la m\xE9thode Empreinte Projet (Annexe 5 du dossier). Les donn\xE9es de ce simulateur alimentent directement cette analyse. Une ACV simplifi\xE9e (niveau 3) sera demand\xE9e lors du suivi d'ex\xE9cution."), /*#__PURE__*/React.createElement("a", {
    href: "https://base-empreinte.ademe.fr/empreinte-projet",
    target: "_blank",
    rel: "noopener",
    className: "inline-block px-4 py-2 rounded-lg text-sm font-bold",
    style: {
      background: T,
      color: "white",
      textDecoration: "none"
    }
  }, "Acc\xE9der \xE0 l'outil Empreinte Projet ADEME \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: nextStep,
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: T
    }
  }, "Suivant \u2192 Budget & d\xE9penses"))), step === 5 && (() => {
    // Auto-mapping budget si vide : étape 2 → nomenclature ADEME
    const tj1 = proj.trajs?.[1] || {};
    const budgetVide = !proj.budget?.some(b => b.montant > 0);
    if (budgetVide && (tj1.iC > 0 || tj1.iE > 0 || tj1.iI > 0 || tj1.gridCost > 0)) {
      const newBudget = proj.budget?.map(b => {
        if (b.id === "equip_prop") return {
          ...b,
          montant: tj1.iC || 0
        };
        if (b.id === "equip_stock") return {
          ...b,
          montant: tj1.iE || 0
        };
        if (b.id === "infra") return {
          ...b,
          montant: (tj1.iI || 0) + (tj1.gridCost || 0)
        };
        if (b.id === "ing_ext") return {
          ...b,
          montant: Math.round(((tj1.iC || 0) + (tj1.iE || 0) + (tj1.iI || 0) + (tj1.gridCost || 0)) * 0.08)
        };
        if (b.id === "certif") return {
          ...b,
          montant: Math.round(((tj1.iC || 0) + (tj1.iE || 0)) * 0.03)
        };
        return b;
      }) || [];
      upd(p => ({
        ...p,
        budget: newBudget
      }));
    }
    return null;
  })() || step === 5 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\uD83D\uDCB0 \xC9tape 5 \xB7 Budget & d\xE9penses"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "Ventilation des d\xE9penses selon la nomenclature ADEME (Guide de cat\xE9gorisation 2026). Les montants sont en k\u20AC HTR (hors taxes r\xE9cup\xE9rables)."), /*#__PURE__*/React.createElement(Cd, {
    title: "Postes de d\xE9penses \xE9ligibles (montants en k\u20AC = milliers d'euros)"
  }, ADEME_EXPENSE_CATS.map((cat, i) => /*#__PURE__*/React.createElement("div", {
    key: cat.id,
    className: "flex items-center gap-3 mb-2 p-2 rounded",
    style: {
      background: i % 2 ? "#fafafa" : "white"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold",
    style: {
      color: D
    }
  }, cat.l), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, cat.poste, " \u2192 ", cat.sub, " \xB7 ", cat.ex)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 0,
    value: proj.budget?.[i]?.montant || 0,
    onChange: e => upd(p => {
      const budget = [...(p.budget || [])];
      budget[i] = {
        ...budget[i],
        montant: Math.max(0, parseFloat(e.target.value) || 0)
      };
      return {
        ...p,
        budget
      };
    }),
    className: "w-24 text-right border rounded px-2 py-1 text-sm",
    style: {
      borderColor: "#ddd"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs",
    style: {
      color: "#aaa"
    }
  }, "k\u20AC")))), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 p-3 rounded-lg",
    style: {
      background: D + "08",
      borderTop: "2px solid " + T
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-sm",
    style: {
      color: D
    }
  }, "TOTAL D\xC9PENSES DU PROJET"), /*#__PURE__*/React.createElement("span", {
    className: "text-lg font-bold",
    style: {
      color: T
    }
  }, fK(proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || 0))), (() => {
    const tot = proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || 0;
    const minBudget = proj.v.entSize === "GE" ? 1000 : 300;
    if (tot < minBudget) return /*#__PURE__*/React.createElement("div", {
      className: "text-xs mt-1 font-bold",
      style: {
        color: AC
      }
    }, "\u26A0\uFE0F Budget minimum : ", fK(minBudget), " (", proj.v.entSize === "GE" ? "grande entreprise" : "PME", ")");
    return null;
  })())), /*#__PURE__*/React.createElement(Cd, {
    title: "Surco\xFBt \xE9ligible = base de calcul de l'aide",
    accent: T
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2",
    style: {
      color: "#888"
    }
  }, "Le surco\xFBt est la diff\xE9rence entre le co\xFBt du projet d\xE9carbon\xE9 et le co\xFBt du sc\xE9nario contrefactuel."), /*#__PURE__*/React.createElement("div", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: T
    }
  }, fK(surcout)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, "Assiette \xE9ligible pour le calcul de l'aide"))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: nextStep,
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: T
    }
  }, "Suivant \u2192 Calcul de l'aide"))), step === 6 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\uD83D\uDCCA \xC9tape 6 \xB7 Calcul de l'aide & scoring"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "Estimation du montant d'aide et simulation de la note ADEME (indicative)."), /*#__PURE__*/React.createElement(Cd, {
    title: "Montant de l'aide estim\xE9",
    accent: GR
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-4 text-center"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#888"
    }
  }, "Taux applicable"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: T
    }
  }, aide.taux, "%"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, aide.cls === "emissionNulle" ? "Émission nulle" : aide.cls === "propre" ? "Navire propre" : "Efficacité")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#888"
    }
  }, "Surco\xFBt \xE9ligible"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: D
    }
  }, fK(surcout))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#888"
    }
  }, "Aide estim\xE9e"), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: GR
    }
  }, fK(aide.aide)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, "Plafond : 6 000 k\u20AC"))), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 text-xs p-2 rounded",
    style: {
      background: LB
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "R\xE9gime : "), aide.regime)), /*#__PURE__*/React.createElement(Cd, {
    title: "Autres aides publiques sollicit\xE9es ou obtenues",
    accent: W
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2",
    style: {
      color: "#888"
    }
  }, "Exigence CdC : lister toutes les aides publiques sur les 3 derni\xE8res ann\xE9es (montants et dispositifs). Le cumul ne doit pas d\xE9passer les plafonds du r\xE9gime d'aide applicable."), /*#__PURE__*/React.createElement(In, {
    l: "Autres aides publiques sollicit\xE9es pour ce projet",
    v: proj.autresAides || 0,
    onChange: v => upd(p => ({
      ...p,
      autresAides: v
    })),
    u: "k\u20AC",
    h: "Fonds vert, FEDER, r\xE9gions, BPI, France 2030... Le total (aide ADEME + autres) ne peut pas d\xE9passer le surco\xFBt \xE9ligible."
  }), /*#__PURE__*/React.createElement(In, {
    l: "Nom des dispositifs",
    v: proj.autresAidesDetail || "",
    t: "text",
    onChange: v => upd(p => ({
      ...p,
      autresAidesDetail: v
    })),
    n: "Ex : Fonds vert 150 k\u20AC, R\xE9gion Bretagne 80 k\u20AC"
  }), aide.aide + (proj.autresAides || 0) > surcout && surcout > 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-xs p-2 rounded mt-2 font-bold",
    style: {
      background: AC + "15",
      color: AC
    }
  }, "Attention : le total des aides (", fK(aide.aide + (proj.autresAides || 0)), ") d\xE9passe le surco\xFBt \xE9ligible (", fK(surcout), ").")), scoring && /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83C\uDFAF Profil de comp\xE9titivit\xE9 ADEME (indicatif)",
    accent: PU
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-3",
    style: {
      color: "#888"
    }
  }, "Estimation indicative. Le classement final d\xE9pend des autres projets d\xE9pos\xE9s (enveloppe 70 M\u20AC pour ~200 projets candidats, source : Armateurs de France). Les fourchettes ci-dessous situent votre projet par rapport aux ordres de grandeur typiques des op\xE9rateurs de proximit\xE9."), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-4 gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center p-3 rounded-lg",
    style: {
      background: D + "08"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: T
    }
  }, scoring.total.toFixed(0)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold",
    style: {
      color: D
    }
  }, "/ 100 pts")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-2 rounded-lg",
    style: {
      background: GR + "10"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold",
    style: {
      color: GR
    }
  }, scoring.noteEnviron.toFixed(0)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs"
  }, "Environnement"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#aaa"
    }
  }, "/ 45 pts")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-2 rounded-lg",
    style: {
      background: T + "10"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold",
    style: {
      color: scoring.noteAide < 0 ? AC : T
    }
  }, scoring.noteAide.toFixed(0)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs"
  }, "Efficacit\xE9 aide"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#aaa"
    }
  }, "/ 25 pts")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-2 rounded-lg",
    style: {
      background: PU + "10"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold",
    style: {
      color: PU
    }
  }, scoring.noteTechEco.toFixed(0)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs"
  }, "Qualit\xE9/R\xE9silience"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#aaa"
    }
  }, "/ 30 pts"))), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-lg",
    style: {
      background: scoring.ratioEuroParTonne > 200 ? AC + "15" : scoring.ratioEuroParTonne > 100 ? W + "15" : GR + "15"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold",
    style: {
      color: D
    }
  }, "Ratio \u20AC/tCO\u2082 \xE9vit\xE9e :"), /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-bold",
    style: {
      color: scoring.ratioEuroParTonne > 200 ? AC : scoring.ratioEuroParTonne > 100 ? W : GR
    }
  }, scoring.ratioEuroParTonne === Infinity ? "∞" : scoring.ratioEuroParTonne + " €/tCO₂")), scoring.ratioEuroParTonne > 200 && /*#__PURE__*/React.createElement("div", {
    className: "text-xs mt-1 font-bold",
    style: {
      color: AC
    }
  }, "\u26A0\uFE0F ALERTE : Au-dessus de 200 \u20AC/tCO\u2082, le projet re\xE7oit une note de -5 pts (quasi \xE9liminatoire)."))), res && res.length >= 2 && /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCD0 Analyse de sensibilite (3 scenarios)"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-2",
    style: {
      color: "#888"
    }
  }, "Robustesse du projet selon les hypotheses (exigence CdC p.28). Les gains technologiques varient de -30% (degrade) a +max (favorable)."), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-lg",
    style: {
      background: AC + "10"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold mb-1",
    style: {
      color: AC
    }
  }, "Degrade (-30%)"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold"
  }, fK(res[1].deg.ccv)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, "CCV"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold mt-1"
  }, fmt(Math.round(res[1].deg.co2)), " t"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, "CO2 cumule")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-lg",
    style: {
      background: T + "10",
      border: "2px solid " + T
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold mb-1",
    style: {
      color: T
    }
  }, "Central (base)"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold"
  }, fK(res[1].base.ccv)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, "CCV"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold mt-1"
  }, fmt(Math.round(res[1].base.co2)), " t"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, "CO2 cumule")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-lg",
    style: {
      background: GR + "10"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold mb-1",
    style: {
      color: GR
    }
  }, "Favorable (max)"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold"
  }, fK(res[1].fav.ccv)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, "CCV"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold mt-1"
  }, fmt(Math.round(res[1].fav.co2)), " t"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs",
    style: {
      color: "#999"
    }
  }, "CO2 cumule"))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-2",
    style: {
      color: "#999"
    }
  }, "Source : 3 scenarios CCV (base, gains -30%, gains max). Degradation moteur fossile +1,5%/an (MAN Energy Solutions 2023).")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: nextStep,
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: T
    }
  }, "Suivant \u2192 Mon dossier"))), step === 7 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold mb-1",
    style: {
      color: D
    }
  }, "\uD83D\uDCC4 \xC9tape 7 \xB7 Mon dossier"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mb-4",
    style: {
      color: "#888"
    }
  }, "Votre pr\xE9-dossier est pr\xEAt. Exportez-le en HTML imprimable, puis compl\xE9tez les pi\xE8ces administratives sur la plateforme AGIR."), /*#__PURE__*/React.createElement(Cd, {
    title: "Fiche de synth\xE8se du projet",
    accent: T
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 text-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Navire :"), " ", proj.v.name || "(non nommé)", " \xB7 ", VT.find(x => x.id === proj.v.type)?.l), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "LOA :"), " ", proj.v.loa, "m | ", /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "GT :"), " ", proj.v.gt, " | ", /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Puissance :"), " ", proj.v.pP, " kW"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Classification ADEME :"), " ", aide.cls === "emissionNulle" ? "Navire à émission nulle" : aide.cls === "propre" ? "Navire propre" : "Navire plus efficace"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Taille :"), " ", proj.v.entSize, " | ", /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Zone AFR :"), " ", proj.v.zoneAFR), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Budget total :"), " ", fK(proj.budget?.reduce((s, b) => s + (b.montant || 0), 0) || res?.[1]?.totI || 0)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Aide estim\xE9e :"), " ", fK(aide.aide), " (", aide.taux, "%)"), scoring && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "CO\u2082 \xE9vit\xE9 (5 ans) :"), " ", fmt(scoring.co2Evite), " tonnes"), scoring && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "Ratio :"), " ", scoring.ratioEuroParTonne, " \u20AC/tCO\u2082"))), /*#__PURE__*/React.createElement(Cd, {
    title: "\u2705 Checklist des pi\xE8ces \xE0 joindre"
  }, [["Annexe 1 · Présentation projet (pré-dépôt)", true], ["Annexe 2 · Fiche lauréat", false], ["Annexe 3.a · Descriptif détaillé du projet", true], ["Annexe 3.b · Descriptif du porteur", false], ["Annexe 4 · Base de données des coûts", true], ["Annexe 5 · Grille d'impacts + Empreinte projet", true], ["Annexe 6 · Éléments financiers (TRI, plan financement)", false], ["Annexe 7 · Attestation santé financière", false], ["KBIS de moins de 3 mois", false], ["3 dernières liasses fiscales", false], ["Devis / lettres d'intention fournisseurs", false], ["Contrat d'avitaillement ou LOI (si carburant alternatif)", false]].map(([label, auto], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex items-center gap-2 text-xs py-1"
  }, /*#__PURE__*/React.createElement("span", null, auto ? "✅" : "⬜"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: auto ? GR : "#666"
    }
  }, label), auto && /*#__PURE__*/React.createElement("span", {
    className: "text-xs px-1 rounded",
    style: {
      background: GR + "20",
      color: GR,
      fontSize: 9
    }
  }, "Pr\xE9-rempli")))), /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCC5 Calendrier"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-1 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between p-1.5 rounded",
    style: {
      background: LB
    }
  }, /*#__PURE__*/React.createElement("span", null, "Pr\xE9d\xE9p\xF4t (r\xE9union ADEME, 45 min)"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold",
    style: {
      color: T
    }
  }, "Avant le 22 juin 2026")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between p-1.5 rounded",
    style: {
      background: AC + "10"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold"
  }, "D\xE9p\xF4t final sur AGIR"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold",
    style: {
      color: AC
    }
  }, "6 juillet 2026 (23h59)")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between p-1.5 rounded"
  }, /*#__PURE__*/React.createElement("span", null, "D\xE9cision ADEME"), /*#__PURE__*/React.createElement("span", null, "~3 mois apr\xE8s cl\xF4ture")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between p-1.5 rounded"
  }, /*#__PURE__*/React.createElement("span", null, "Contractualisation"), /*#__PURE__*/React.createElement("span", null, "~6 mois apr\xE8s cl\xF4ture")))), /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCDD Texte de contexte pr\xE9-r\xE9dig\xE9 (\xE0 int\xE9grer dans l'Annexe 3.a)"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs p-3 rounded",
    style: {
      background: LB,
      lineHeight: 1.6
    }
  }, "Ce projet s'inscrit dans le cadre de l'article 301 de la loi n\xB0 2021-1104 du 22 ao\xFBt 2021 (Climat et R\xE9silience) et de la Feuille de route de d\xE9carbonation de la fili\xE8re maritime fran\xE7aise, pilot\xE9e par la DGAMPA et le CMF. Il contribue directement aux objectifs de la strat\xE9gie OMI r\xE9vis\xE9e de 2023 visant la neutralit\xE9 carbone du transport maritime d'ici 2050, avec un point de contr\xF4le interm\xE9diaire de \u221220% en 2030 par rapport \xE0 2008.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "Ce projet correspond \xE0 une transition souveraine, ancr\xE9e localement : les prestataires techniques sont fran\xE7ais, le service rendu est un service public visible au quotidien par le contribuable, et les retomb\xE9es \xE9conomiques (emplois, maintenance, exploitation) b\xE9n\xE9ficient directement au territoire. La compagnie est captive en mati\xE8re d'opportunit\xE9s d'avitaillement \xB7 desserte locale depuis un port secondaire non \xE9quip\xE9 en combustible alternatif \xB7 ce qui rend le soutien public d'autant plus d\xE9terminant pour permettre la transition \xE9nerg\xE9tique.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "Le porteur est membre du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau), qui repr\xE9sente 165 navires et 30 compagnies de transport maritime de proximit\xE9, dont 90% de TPE/PME.")), /*#__PURE__*/React.createElement(Cd, {
    title: "\uD83D\uDCD6 Sources et m\xE9thodologie de calcul"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-2",
    style: {
      color: "#555",
      lineHeight: 1.6
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-bold",
    style: {
      color: D
    }
  }, "Scoring ADEME (100 points) \xB7 CdC pp. 27-29"), /*#__PURE__*/React.createElement("p", null, "\u2022 Efficacit\xE9 environnementale (45 pts) : quantit\xE9 CO\u2082e \xE9vit\xE9e sur 5 ans (15 pts, compar\xE9e au meilleur projet, estimation GASPE : max ~5 000 tCO\u2082) + gain relatif en % vs sc\xE9nario de r\xE9f\xE9rence (30 pts, formule : 30 \xD7 (1 \u2212 tCO\u2082_projet / tCO\u2082_ref))"), /*#__PURE__*/React.createElement("p", null, "\u2022 Efficacit\xE9 des aides publiques (25 pts) : ratio \u20AC aide / tCO\u2082 \xE9vit\xE9e. Si ratio ", ">", " 200 \u20AC/tCO\u2082 \u2192 note de \u22125 (quasi \xE9liminatoire). Sinon : 25 \xD7 meilleur_ratio / ratio_projet"), /*#__PURE__*/React.createElement("p", null, "\u2022 Qualit\xE9 technico-\xE9conomique + r\xE9silience (30 pts) : TRL (5 pts), r\xE9ductions hors-GES (5 pts), montage dossier GASPE (10 pts), localisation FR/EEE (10 pts)"), /*#__PURE__*/React.createElement("p", {
    className: "font-bold mt-3",
    style: {
      color: D
    }
  }, "Taux d'aide LDACEE \xB7 CdC Annexe 2, r\xE9gime SA.111726"), /*#__PURE__*/React.createElement("p", null, "\u2022 Navire \xE9mission nulle (\u226599% z\xE9ro-CO\u2082) : PE 60% / ME 50% / GE 30%"), /*#__PURE__*/React.createElement("p", null, "\u2022 Navire propre (\u226525% z\xE9ro-CO\u2082) : PE 50% / ME 40% / GE 20%"), /*#__PURE__*/React.createElement("p", null, "\u2022 Efficacit\xE9 avec contrefactuel : PE 50% / ME 40% / GE 30% (hors AFR), +5% zone c, +15% zone a"), /*#__PURE__*/React.createElement("p", null, "\u2022 Efficacit\xE9 sans contrefactuel : taux divis\xE9s par 2"), /*#__PURE__*/React.createElement("p", null, "\u2022 \xC9tudes/conseil : PE 80% / ME 70% / GE 60%"), /*#__PURE__*/React.createElement("p", {
    className: "font-bold mt-3",
    style: {
      color: D
    }
  }, "Dimensionnement batteries (dimBatt)"), /*#__PURE__*/React.createElement("p", null, "\u2022 \xC9nergie par travers\xE9e = P_propulsion \xD7 dur\xE9e \xD7 facteur de charge / 0.80 (SoC 10-90%, DNV Pt.6 Ch.2 Sec.1)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Contrainte puissance = P_cr\xEAte / 2C (Corvus Orca ESS, d\xE9charge continue 2C max)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Chargeur = E_travers\xE9e / (temps_quai/60) \xD7 1.1 (ABB Marine 2022)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Co\xFBt batteries : 450 \u20AC/kWh install\xE9 maritime (Corvus Orca ESS 2024, incl. BMS, refroidissement, certification BV NR 547), chargeur 200 \u20AC/kW"), /*#__PURE__*/React.createElement("p", null, "\u2022 Cycles LFP : 5 000 \xE0 80% DoD (Preger et al. 2020, J. Electrochem. Soc. 167)"), /*#__PURE__*/React.createElement("p", {
    className: "font-bold mt-3",
    style: {
      color: D
    }
  }, "\xC9missions"), /*#__PURE__*/React.createElement("p", null, "\u2022 CO\u2082 : 3,206 kgCO\u2082/kg MDO (IMO MEPC.1/Circ.684)"), /*#__PURE__*/React.createElement("p", null, "\u2022 SOx/NOx/PM : IMO GHG Study 2020, ENTEC 2005"), /*#__PURE__*/React.createElement("p", null, "\u2022 Prix MDO : 850 \u20AC/t (EIA STEO mars 2026, post-crise Iran, Brent ~80-95 $/bbl)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Escalade carburant : 4%/an (risque g\xE9opolitique structurel post-fermeture Ormuz)"), /*#__PURE__*/React.createElement("p", {
    className: "font-bold mt-3",
    style: {
      color: D
    }
  }, "Analyse de sensibilit\xE9 (robustesse)"), /*#__PURE__*/React.createElement("p", null, "Les r\xE9sultats CCV sont calcul\xE9s en 3 sc\xE9narios : base (gains technologiques m\xE9dians), d\xE9grad\xE9 (gains r\xE9duits de 30%), favorable (gains maximaux). L'\xE9cart entre les sc\xE9narios mesure l'incertitude du projet. Les param\xE8tres sensibles sont : prix carburant (\xB120%), d\xE9gradation batteries (\xB12 ans sur la dur\xE9e de vie), facteur de charge (\xB110%). La d\xE9gradation du moteur fossile (+1,5%/an, source MAN Energy Solutions 2023) est int\xE9gr\xE9e dans le sc\xE9nario de r\xE9f\xE9rence."), /*#__PURE__*/React.createElement("p", {
    className: "font-bold mt-3",
    style: {
      color: D
    }
  }, "Cadre r\xE9glementaire"), /*#__PURE__*/React.createElement("p", null, "\u2022 AAP ADEME 2026 : CdC publi\xE9 le 2 avril 2026, cl\xF4ture 6 juillet 2026"), /*#__PURE__*/React.createElement("p", null, "\u2022 Art. 301, loi n\xB0 2021-1104 (Climat et R\xE9silience)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Strat\xE9gie OMI r\xE9vis\xE9e 2023 (selection par comite : DGAMPA, DGE, DGITM, Direction du Budget, CBCM, ADEME) : neutralit\xE9 2050, \u221220% en 2030"), /*#__PURE__*/React.createElement("p", null, "\u2022 R\xE9gime SA.111726 (LDACEE), SA.111728 (PME), SA.119559 (AFR)"), /*#__PURE__*/React.createElement("p", null, "\u2022 Classification navire : RGEC art. 36 ter (navire propre / \xE9mission nulle)"), /*#__PURE__*/React.createElement("p", null, "\u2022 DNSH : art. 17, r\xE8glement UE 2020/852 (Taxonomie)"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3 mt-4"
  }, /*#__PURE__*/React.createElement("a", {
    href: "mailto:aap.navires@ademe.fr",
    className: "inline-block px-4 py-2 rounded-lg text-sm font-bold mb-2",
    style: {
      background: AC,
      color: "white",
      textDecoration: "none"
    }
  }, "\u2709 Contacter l'ADEME pour un crash test pre-depot (recommande)"), /*#__PURE__*/React.createElement("a", {
    href: "https://agirpourlatransition.ademe.fr/entreprises/aides-financieres/catalogue/aap/aides-linvestissement-pour-la-decarbonation-du-transport-et-des-services-maritimes",
    target: "_blank",
    rel: "noopener",
    className: "text-center py-3 rounded-xl text-white font-bold text-sm",
    style: {
      background: T,
      textDecoration: "none"
    }
  }, "\uD83C\uDF10 Plateforme AGIR"), /*#__PURE__*/React.createElement("a", {
    href: "mailto:aap.navires@ademe.fr",
    className: "text-center py-3 rounded-xl font-bold text-sm",
    style: {
      border: "2px solid " + T,
      color: T,
      textDecoration: "none"
    }
  }, "\u2709\uFE0F Contact ADEME")), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 p-3 rounded-lg text-xs",
    style: {
      background: T + "10",
      border: "1px solid " + T + "30"
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-bold mb-1"
  }, "Contact GASPE pour accompagnement :"), /*#__PURE__*/React.createElement("p", null, "Le GASPE accompagne ses adh\xE9rents dans le montage de leurs dossiers ADEME. Contactez le D\xE9l\xE9gu\xE9 G\xE9n\xE9ral pour un appui personnalis\xE9 sur l'argumentaire environnemental, le dimensionnement technique et le positionnement strat\xE9gique du dossier."), /*#__PURE__*/React.createElement("a", {
    href: "https://gaspe.fr",
    target: "_blank",
    rel: "noopener",
    className: "inline-block mt-2 px-3 py-1 rounded font-bold",
    style: {
      background: "white",
      color: D,
      textDecoration: "none"
    }
  }, "gaspe.fr")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between mt-6"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: prevStep,
    className: "px-4 py-2 rounded-xl text-sm",
    style: {
      border: "1px solid #ddd",
      color: "#888"
    }
  }, "\u2190 Retour"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const w = window.open('', '_blank');
      const vt = VT.find(x => x.id === proj.v.type);
      const cls = classifyVessel(proj.trajs?.[1]?.fuelMix);
      w.document.write('<html><head><title>Pre-dossier ADEME - ' + (proj.v.name || proj.name) + '</title>');
      w.document.write('<style>@page{size:A4;margin:2cm}body{font-family:system-ui,sans-serif;font-size:11px;color:#1E2D3D;line-height:1.6}h1{font-size:18px;color:#1B9AAA;border-bottom:2px solid #1B9AAA;padding-bottom:8px}h2{font-size:14px;color:#1E2D3D;margin-top:20px;border-bottom:1px solid #ddd;padding-bottom:4px}table{width:100%;border-collapse:collapse;margin:8px 0}td,th{border:1px solid #ddd;padding:6px;text-align:left}th{background:#EAF4F7}.header{text-align:center;margin-bottom:24px}.footer{margin-top:32px;padding-top:12px;border-top:1px solid #ddd;font-size:9px;color:#999;text-align:center}.tag{display:inline-block;padding:2px 8px;border-radius:4px;font-weight:bold;font-size:10px}</style></head><body>');
      w.document.write('<div class="header"><h1>Pre-dossier AAP ADEME 2026</h1>');
      w.document.write('<p>Decarbonation du transport et des services maritimes</p></div>');
      w.document.write('<h2>1. Fiche de synthese</h2>');
      w.document.write('<table><tr><th>Navire</th><td>' + (proj.v.name || '-') + '</td><th>Type</th><td>' + (vt?.l || '-') + '</td></tr>');
      w.document.write('<tr><th>LOA</th><td>' + proj.v.loa + ' m</td><th>GT</th><td>' + proj.v.gt + '</td></tr>');
      w.document.write('<tr><th>Puissance</th><td>' + proj.v.pP + ' kW</td><th>Classification</th><td>' + (cls === 'emissionNulle' ? 'Emission nulle' : cls === 'propre' ? 'Navire propre' : 'Efficacite amelioree') + '</td></tr>');
      w.document.write('<tr><th>Taille entreprise</th><td>' + proj.v.entSize + '</td><th>Region</th><td>' + (REGIONS.find(r => r.id === proj.v.region)?.l || '-') + '</td></tr></table>');
      w.document.write('<h2>2. Projet de decarbonation</h2>');
      const techList = Object.entries(proj.trajs?.[1]?.techs || {}).filter(([, x]) => x?.a).map(([tid]) => TECHS.find(t => t.id === tid)?.l).join(', ');
      w.document.write('<p><b>Technologies :</b> ' + (techList || '-') + '</p>');
      const mixStr = Object.entries(proj.trajs?.[1]?.fuelMix || {}).filter(([, v]) => v > 0).map(([k, v]) => DEF_FUELS.find(f => f.id === k)?.l + ' ' + v + '%').join(', ');
      w.document.write('<p><b>Mix energetique cible :</b> ' + (mixStr || '-') + '</p>');
      w.document.write('<h2>3. Scenario contrefactuel</h2>');
      w.document.write('<p><b>Type :</b> ' + (proj.contrefactuel?.type || '-') + '</p>');
      w.document.write('<p><b>Surcout eligible :</b> ' + fK(surcout) + '</p>');
      w.document.write('<h2>4. Gains environnementaux (5 ans)</h2>');
      if (scoring) {
        w.document.write('<table><tr><th>CO2 evite</th><td>' + fmt(scoring.co2Evite) + ' t</td><th>Gain relatif</th><td>' + scoring.gainPct + '%</td></tr></table>');
      }
      w.document.write('<h2>5. Budget</h2>');
      w.document.write('<table><tr><th>Poste</th><th>Montant (k EUR)</th></tr>');
      (proj.budget || []).filter(b => b.montant > 0).forEach(b => {
        const cat = ADEME_EXPENSE_CATS.find(c => c.id === b.id);
        w.document.write('<tr><td>' + (cat?.l || b.id) + '</td><td>' + fmt(b.montant) + '</td></tr>');
      });
      w.document.write('</table>');
      w.document.write('<h2>6. Aide estimee</h2>');
      w.document.write('<table><tr><th>Taux</th><td>' + aide.taux + '%</td><th>Aide</th><td>' + fK(aide.aide) + '</td></tr>');
      w.document.write('<tr><th>Ratio</th><td>' + (scoring?.ratioEuroParTonne || '-') + ' EUR/tCO2</td><th>Regime</th><td>' + aide.regime + '</td></tr></table>');
      // Annexe 1 - DNSH
      w.document.write('<h2>Annexe 1 - Do No Significant Harm (DNSH)</h2>');
      (proj.dnsh || []).forEach((d, i) => {
        const ax = DNSH_AXES[i];
        if (ax) w.document.write('<p><b>' + ax.l + ' :</b> ' + (d.text || ax.template) + '</p>');
        if (d.fournisseur) w.document.write('<p><i>Fournisseur recyclage : ' + d.fournisseur + '</i></p>');
        if (d.certification) w.document.write('<p><i>Certification bruit : ' + d.certification + '</i></p>');
        if (d.antifouling) w.document.write('<p><i>Antifouling : ' + d.antifouling + '</i></p>');
      });
      // Annexe 2 - Methodologie de calcul des emissions
      w.document.write('<h2>Annexe 2 - Note methodologique emissions GES</h2>');
      w.document.write('<p><b>Facteur emission MDO :</b> 3,206 kgCO2/kg (IMO MEPC.1/Circ.684)</p>');
      w.document.write('<p><b>Densite MDO :</b> 0,85 kg/L (ISO 8217:2017, grade DMB)</p>');
      w.document.write('<p><b>Degradation moteur fossile :</b> +1,5%/an (MAN Energy Solutions 2023)</p>');
      w.document.write('<p><b>Periode de reference :</b> 5 ans (thematique 1)</p>');
      if (scoring) {
        w.document.write('<p><b>CO2 evite (5 ans) :</b> ' + fmt(scoring.co2Evite) + ' t</p>');
        w.document.write('<p><b>Gain relatif :</b> ' + scoring.gainPct + '%</p>');
        w.document.write('<p><b>Ratio aide/tCO2 :</b> ' + scoring.ratioEuroParTonne + ' EUR/tCO2</p>');
      }
      // Annexe 3 - Souverainete et ancrage territorial
      w.document.write('<h2>Annexe 3 - Ancrage territorial et souverainete</h2>');
      w.document.write('<p>Ce projet correspond a une transition souveraine, ancree localement : les prestataires techniques sont francais, le service rendu est un service public visible au quotidien par le contribuable, et les retombees economiques (emplois, maintenance, exploitation) beneficient directement au territoire. La compagnie est captive en matiere d\'opportunites d\'avitaillement (desserte locale, port secondaire non equipe en combustible alternatif).</p>');
      // Annexe 4 - Aides publiques
      w.document.write('<h2>Annexe 4 - Aides publiques sollicitees</h2>');
      w.document.write('<table><tr><th>Dispositif</th><th>Montant (k EUR)</th></tr>');
      w.document.write('<tr><td>ADEME AAP 2026</td><td>' + fK(aide.aide) + '</td></tr>');
      if (proj.autresAides > 0) w.document.write('<tr><td>' + (proj.autresAidesDetail || 'Autres') + '</td><td>' + fK(proj.autresAides) + '</td></tr>');
      w.document.write('<tr><td><b>Total</b></td><td><b>' + fK(aide.aide + (proj.autresAides || 0)) + '</b></td></tr></table>');
      w.document.write('<div class="footer">GASPE - Localement ancrees. Socialement engagees.<br>Simulateur AAP ADEME 2026 v1.6.0 - ' + new Date().toLocaleDateString('fr-FR') + '</div>');
      w.document.write('</body></html>');
      w.document.close();
      w.print();
    },
    className: "px-6 py-2.5 rounded-xl text-white font-bold text-sm",
    style: {
      background: PU
    }
  }, "\uD83D\uDDA8\uFE0F Exporter pre-dossier PDF (format A4)"))), /*#__PURE__*/React.createElement("div", {
    className: "text-center py-4 mt-6",
    style: {
      borderTop: "1px solid #e5e7eb"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("img", {
    src: GASPE_A_COULEUR,
    alt: "",
    style: {
      height: 20,
      borderRadius: 3
    }
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs",
    style: {
      color: "#bbb"
    }
  }, "Localement ancr\xE9es. Socialement engag\xE9es.")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs mt-1",
    style: {
      color: "#ccc"
    }
  }, "v1.6.0 \xB7 Simulateur AAP ADEME 2026 \xB7 Propuls\xE9 par", " ", /*#__PURE__*/React.createElement("a", {
    href: "https://vaiata-dynamics.com/fr/",
    target: "_blank",
    rel: "noopener",
    style: {
      color: T
    }
  }, "VAIATA Dynamics")))));
}
