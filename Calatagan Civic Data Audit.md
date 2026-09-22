# **Independent Adversarial Research Audit: Better Calatagan Civic-Data Foundation**

## **1\. Executive Audit Summary**

An independent adversarial audit of the baseline research and architecture report for Better Calatagan reveals an analytical foundation that correctly identifies statutory disclosure portals but contains critical vulnerabilities in municipal web infrastructure assessment, population demographics, urban planning baselines, and legislative depth. The prior research established that the official municipal domain is inaccessible and recognized the statutory utility of the Department of the Interior and Local Government (DILG) Full Disclosure Policy Portal (FDPP). However, the report operated under several flawed assumptions, failed to uncover subsequent generations of municipal development plans, and left key legal and demographic contradictions unresolved.

The most consequential failure of the baseline report was the assertion that municipal planning documentation ceased after the *Comprehensive Land Use Plan (CLUP) 2001–2010*. Aggressive primary-source discovery recovered two subsequent planning cycles: the *Calatagan Comprehensive Development Plan (CDP) 2017–2026*, a 363-page statutory blueprint encompassing sectoral studies and the Local Development Investment Program (LDIP), and the three-volume *CLUP and Zoning Ordinance 2018–2027*, followed by the *2nd Draft CLUP 2023–2032*1. Furthermore, the original report operated under the outdated assumption that Calatagan remains a Second Class Municipality. Under Department of Finance (DOF) Department Order No. 074.2024 and Bureau of Local Government Finance (BLGF) Memorandum Circular No. 020.2024, Calatagan was officially upgraded to a First Class Municipality pursuant to Republic Act No. 119645.

The audit independently resolves the electoral incumbency question. Current incumbency was confirmed through official Commission on Elections (COMELEC) returns and post-election administrative records: Municipal Mayor Rico B. Puno defeated former incumbent Pedro Palacio IV in the May 2025 elections, while Vice Mayor Rogelio Zarraga retained his seat and continues as the presiding officer of the Sangguniang Bayan1. The demographic contradiction between the Philippine Statistics Authority (PSA) 2024 Census of Population (POPCEN) figure of 60,420 and the Department of Trade and Industry (DTI) Cities and Municipalities Competitiveness Index (CMCI) figure of 64,234 was also resolved5. The CMCI figure is an uncalibrated administrative projection originating from the *CDP 2017–2026* planning baseline, whereas the PSA figure is an empirical door-to-door headcount3.

Significant data gaps remain confirmed. No unified, municipality-wide Citizen's Charter published after 2022 exists in public digital repositories, even though Calatagan achieved top-tier Anti-Red Tape Authority (ARTA) compliance ratings on internal submissions6. In addition, full-text municipal ordinances enacted by the Sangguniang Bayan after 2016 remain absent from online repositories, appearing only as secondary review resolutions passed by the Sangguniang Panlalawigan ng Batangas13. These gaps mandate on-site document retrieval and formal Freedom of Information (FOI) submissions before Better Calatagan can safely publish civic service and legislative databases.

## **2\. Claim Verification Matrix**

&nbsp;

| Original Claim | Result | Evidence | Confidence | Notes |
| :---- | :---- | :---- | :---- | :---- |
| calatagan.gov.ph is offline with no working A record | CONFIRMED | Authoritative recursive DNS queries fail (SERVFAIL/NXDOMAIN). Probes to apex and www hostnames time out with no routing15. | High | The domain has experienced chronic abandonment rather than a transient operational failure. |
| DILG FDPP hosts \~156 filings across 14 statutory forms | PARTIALLY CONFIRMED | The portal maintains statutory forms across quarters, but total filings fluctuate across fiscal years; files mix .xlsx, .xls, and scanned .pdf formats16. | High | Ingestion pipelines must incorporate automated optical character recognition (OCR) fallbacks for scanned tables. |
| Latest accessible Citizen's Charter dates to circa 2022 | PARTIALLY CONFIRMED | No omnibus municipal charter post-2022 is available online; however, office-level charters (Medicare Hospital, BFP) are actively maintained18. | Medium | CMCI 2024 awards Calatagan a perfect 2.0000 ARTA compliance score, confirming internal compliance despite lack of online hosting6. |
| Accessible legislative records become sparse after 2016 | CONFIRMED | No centralized Sangguniang Bayan repository exists online. Post-2016 ordinances appear only via secondary provincial review actions4. | High | Systematic legislative text cannot be ingested via web scrapers and requires on-site FOI acquisition. |
| CLUP 2001–2010 is the latest available development plan | CONTRADICTED | Primary research retrieved the *CDP 2017–2026*, the *CLUP 2018–2027* (Vols 1–3), and the *2nd Draft CLUP 2023–2032*1. | High | The original audit overlooked active statutory instruments accessible through regional planning archives. |
| Only the 2022 COA Annual Audit Report is available | CONTRADICTED | COA Annual Audit Reports exist from CY2018 through CY2023, and financial positions are compiled in the COA 2024 Annual Financial Report5. | High | Longitudinal audit statements and auditor opinions are systematically available across multi-year cycles. |
| 2025 election winners require confirmation of incumbency | CONFIRMED | Incumbency confirmed: Mayor Rico B. Puno and Vice Mayor Rogelio Zarraga are actively discharging executive and legislative duties9. | High | COMELEC canvass returns align with official executive proceedings and the 2026 State of the Municipality Address10. |
| Discrepancy between PSA (60,420) and CMCI (64,234) population | NEW FINDING | Reconciled: PSA 2024 POPCEN (60,420) is an empirical census, while CMCI (64,234) is an uncalibrated administrative projection from the *CDP 2017–2026*3. | High | Publishing both metrics without context would degrade data integrity; PSA must be the authoritative standard. |
| Gaps in barangay PSGC numeric codes suggest missing units | CONTRADICTED | Sequential codes (041008001 through 041008025\) reflect standard PSA alphabetical indexing across all 25 legally constituted barangays5. | High | Gaps in third-party database mirrors represent provincial cross-table query offsets rather than missing local units. |
| Calatagan is categorized as a 2nd Class Municipality | OUTDATED | DOF Department Order No. 074.2024 and BLGF MC No. 020.2024 officially reclassified Calatagan as a 1st Class Municipality5. | High | Retaining the Second Class classification misrepresents municipal fiscal capacity and civil service salary schedules. |

## **3\. Official Calatagan Website Audit**

An independent technical audit confirms that the official domain calatagan.gov.ph is completely non-operational across all network layers15. Recursive and authoritative DNS lookups directed at root and national top-level domain nameservers return hard resolution errors (SERVFAIL and NXDOMAIN)15. No active address records (A or AAAA), canonical name records (CNAME), or mail exchange records (MX) are registered in the .gov.ph zone file managed by the Department of Information and Communications Technology (DICT).

&nbsp;

&nbsp;

&nbsp;

Audit Target: calatagan.gov.ph / www.calatagan.gov.ph  
DNS Resolution Status: Non-existent Domain (NXDOMAIN / SERVFAIL)  
Live IP / A Record: None  
Nameservers Delegated: Inactive / Unreachable  
HTTP/HTTPS Accessibility: Host Unreachable / Network Timeout  
Historical Archive Horizon: Active snapshots 2011 through early 2022  
Current CMS State: Decommissioned  
Audit Timestamp: Mid-2026

Historical analysis using the Internet Archive Wayback Machine demonstrates that calatagan.gov.ph was maintained through 2021 before deteriorating in early 2022\. During its operational phase, the portal was a WordPress deployment hosting municipal executive orders, basic department descriptions, an archived Citizen's Charter directory, and local tourism directories. When the domain failed to renew its hosting or DNS registry parameters with DICT, the site disappeared from the public internet.

A search across national government web registries confirms that the Local Government Unit (LGU) of Calatagan has not migrated to an alternate official domain, such as calataganbatangas.gov.ph, calatagan.com.ph, or calatagan.ph. Furthermore, the LGU has not onboarded onto the DICT Government Web Hosting Service (GWHS) template or established a dedicated sub-portal within the national eGov umbrella.

Instead, the municipal administration has completely decentralized its official communications across secondary and social channels:

> * Executive advisories, disaster declarations, and public notices are issued primarily through the official Facebook page of the Local Chief Executive (*Mayor Rico B. Puno*) and the municipal page (*LGU Calatagan, Batangas*)21.  
> * Higher-level provincial actions and statutory reviews are hosted on the Batangas Provincial Government portal (portal.batangas.gov.ph), which periodically references municipal compliance13.  
> * Devolved frontline offices, such as the *Calatagan Medicare Hospital* and the *Public Employment Service Office (PESO) Calatagan*, maintain separate administrative communications via departmental social accounts18.

The website outage is structural and long-term. Better Calatagan must not build data ingestion architecture around the expectation that calatagan.gov.ph will resume service. Core data pipelines must rely entirely on centralized national statutory repositories rather than local web scrapers.

## **4\. DILG Full Disclosure Portal Audit**

The DILG Full Disclosure Policy Portal (fdpp.dilg.gov.ph) serves as the primary digital repository for Calatagan's mandatory fiscal, budgetary, and procurement disclosures. Mandated by DILG Memorandum Circulars pursuant to the Local Government Code and national budget laws, the portal hosts quarterly and annual financial filings.

&nbsp;

&nbsp;

&nbsp;

Filter Configuration:  
Region: Region IV-A (CALABARZON)  
Province: Batangas  
LGU Type: Municipality  
LGU Name: Calatagan  
Access URL: https://fdpp.dilg.gov.ph/  
Authentication: Public / Unauthenticated

The portal indexes Calatagan's statutory disclosures across several administrative schedules.

&nbsp;

| Statutory Form Name | Mandatory Frequency | Typical Data Format | Availability (CY2022–CY2025) | Machine Readability |
| :---- | :---- | :---- | :---- | :---- |
| Annual Investment Program (AIP) | Annual | PDF / XLSX | Consistent | Moderate; often scanned PDFs with complex schedules |
| Annual Budget Report (General Fund) | Annual | PDF / XLSX | Consistent | Moderate; standardized tables |
| Supplemental Budget | As enacted | PDF | Intermittent | Low; scanned Sangguniang Bayan ordinances |
| Statement of Receipts and Expenditures (SRE) | Quarterly | XLSX / PDF | Consistent (Q1–Q4) | High when native XLSX; variable when scanned |
| 20% Component of IRA/NTA Utilization | Quarterly | XLSX / PDF | Consistent | High; uniform tabular headers16 |
| Local Disaster Risk Reduction Fund (LDRRMF) | Quarterly | XLSX / PDF | Consistent | High; standard DILG-NDRRMC template |
| Special Education Fund (SEF) Utilization | Quarterly | XLSX / PDF | Consistent | High; standardized accounting schedules28 |
| Unliquidated Cash Advances | Quarterly | PDF | Variable | Low to Moderate; scanned registers |
| Manpower Complement (Civil Service) | Quarterly | XLSX / PDF | Consistent | High; standard plantilla vs non-plantilla counts |
| Trust Fund Utilization | Quarterly | XLSX / PDF | Consistent | Moderate; project-specific accounting |
| Gender and Development (GAD) Utilization | Annual | PDF / XLSX | Consistent | Moderate; project-based tracking |
| BAC Resolutions of Re-bidding / Failure | Quarterly | PDF | Intermittent | Low; scanned signed administrative orders |
| Abstract of Bids as Calculated | Quarterly | PDF / XLSX | Moderate | High when raw tabular; low when scanned |
| Notice of Award / Items to Bid | Quarterly | PDF / XLSX | Moderate | Variable; mixed raster scans |

### **Technical Verification and Portal Ingestion Realities**

The original claim that the portal contains roughly 156 filings across 14 statutory forms is partially confirmed. While the 14 statutory forms match national mandates, total accessible records fluctuate as regional administrators replace documents or purge legacy quarters. Filings are directly downloadable without authentication or session-cookie verification.

However, document URLs in the FDPP do not use permanent RESTful identifiers. When an LGU resubmits an updated or corrected filing, the portal assigns a new database index, breaking previously scraped deep links. Furthermore, file formats are heterogeneous: while many uploads are formatted as native Microsoft Excel spreadsheets (.xlsx), numerous quarterly filings—particularly procurement abstracts and supplemental budgets—are uploaded as scanned, multi-page image PDFs. Several .xlsx files are HTML tables saved with an .xlsx extension, causing spreadsheet parsing exceptions in standard data pipelines.

Automated indexing is viable for the SRE, 20% Utilization, and LDRRMF modules, but ingestion systems must implement automated OCR processing to handle image-based PDF uploads.

## **5\. Citizen's Charter Audit**

A cross-agency investigation confirms that no consolidated, municipal-wide Citizen's Charter for Calatagan has been published online since the approximately 2022 edition captured before calatagan.gov.ph went offline17. Automated searches across repositories maintained by the Anti-Red Tape Authority (ARTA), the Civil Service Commission (CSC), and DILG Calabarzon reveal no publicly downloadable omnibus PDF for 2023, 2024, 2025, or 2026\.

Despite this absence, official performance evaluations indicate that an updated physical charter exists within the local government complex. In the 2024 Cities and Municipalities Competitiveness Index (CMCI), Calatagan ranked 1st among all 1st to 2nd Class Municipalities nationwide in *Compliance to ARTA Citizen's Charter*, receiving a perfect score of 2.00006. This confirms that the municipal administration satisfied ARTA requirements by submitting updated internal service standards directly to ARTA compliance monitors and displaying service flowcharts on physical billboards in the Calatagan Municipal Hall6. However, the LGU has failed to publish this document digitally.

Frontline offices and devolved entities operating within Calatagan maintain active, office-specific service standards:

> * The Calatagan Medicare Hospital, located in Barangay IV Poblacion, conducted a formal review during its January 2026 General Assembly, presenting updated service standards covering emergency intake, PhilHealth claims adjudication, and pharmacy procedures18.  
> * The Bureau of Fire Protection (BFP) Calatagan Municipal Station maintains physical Citizen's Charter flowcharts detailing turnaround times, application requirements, and statutory fees for Fire Safety Inspection Certificates (FSIC) pursuant to Republic Act No. 1103219.

The Better Calatagan platform cannot publish the archived 2022 Citizen's Charter as the definitive current standard without risking inaccuracies regarding fees, documentary requirements, and processing timelines. The 2022 material must be presented strictly as an archival baseline, accompanied by an advisory stating that service standards must be verified in person at the Calatagan Municipal Hall until an updated digital charter is released6.

## **6\. Legislative Records Audit**

Municipal legislative documentation for Calatagan remains severely constrained. The finding that accessible municipal legislative records become sparse after 2016 is confirmed: no systematic, public digital database of Sangguniang Bayan ordinances, resolutions, or executive orders exists.

Manual searches across provincial, departmental, and legal repositories uncovered isolated legislative instruments enacted across multiple administrations:

> * Municipal Ordinance No. 9, Series of 2000: Enacted the first comprehensive zoning regulations for Calatagan30.  
> * Sangguniang Bayan Municipal Ordinance No. 03-2005: Authorized the municipal bond flotation of ₱35 million with the Philippine Veterans Bank to finance local infrastructure initiatives31.  
> * Municipal Ordinance No. 2003-095 (subsequently expanded circa 2010): Established the Calatagan Ecological Solid Waste Management and Eco-Bank Program27.  
> * Sangguniang Bayan Resolution No. 180, Series of 2020: Adopted emergency pandemic measures and quarantine protocols, later reviewed by the Sangguniang Panlalawigan ng Batangas14.  
> * Municipal Ordinance Enacting the Zoning Regulations 2017–2027: Adopted Volume 3 of the GIS-based Comprehensive Land Use Plan4.  
> * Sangguniang Bayan Resolution Adopting the CLUP 2023–2032: Approved the 10-year spatial framework plan, currently undergoing provincial integration1.

The primary mechanism for tracking municipal legislation is the legislative repository of the Provincial Government of Batangas (portal.batangas.gov.ph/sanggunian-resolutions/)13. Under Section 56 of the Local Government Code (Republic Act No. 7160), all municipal appropriation ordinances, revenue measures, and general legislative acts must be submitted to the Sangguniang Panlalawigan for review1. While the provincial portal records resolutions affirming Calatagan measures, it frequently provides only provincial committee summary titles, omitting the full text of the municipal ordinances13.

A complete legislative archive cannot be assembled via public web harvesting alone. Sangguniang Bayan records post-2016 represent a confirmed data gap that requires formal on-site FOI requests to the Secretary to the Sanggunian at the Calatagan Legislative Building.

## **7\. Development and Planning Document Audit**

The adversarial audit contradicts the original finding that Calatagan lacks development plans beyond the *CLUP 2001–2010*. Targeted discovery across departmental repositories, housing archives, and academic databases uncovered three modern, statutory planning documents that provide detailed physical, spatial, and economic frameworks for the municipality.

The planning framework for Calatagan is organized hierarchically:

> * The *Comprehensive Development Plan (CDP) 2017–2026* is a 363-page multisectoral development blueprint prepared by the Municipal Planning and Development Office (MPDO)3. It covers five core development sectors—Social, Economic, Infrastructure, Environmental, and Institutional—and incorporates the Local Development Investment Program (LDIP), which prioritizes capital investment projects3.  
> * The *Comprehensive Land Use Plan (CLUP) 2018–2027* consists of three volumes: Volume 1 (The Comprehensive Land Use Plan), Volume 2 (Sectoral Studies), and Volume 3 (The Zoning Ordinance)2. It established a GIS-based physical framework allocating land for ecotourism, climate-resilient agriculture, and coastal conservation2.  
> * The *2nd Draft Calatagan CLUP 2023–2032* updates the 10-year spatial plan, with a focus on climate risks, disaster mitigation, and coastal resource management1. Volume 1 includes formal acknowledgments and executive messages from Vice Mayor Rogelio Zarraga1.  
> * Specialized sectoral plans include the *Forest Land Use Plan (FLUP)*, developed jointly with the Department of Environment and Natural Resources (DENR) CALABARZON, the *Local Disaster Risk Reduction and Management Plan (LDRRMP)*, prepared with GeoInfometrics Solutions, and the *Solid Waste Management Plan*, centered on the Eco-Bank framework24.

&nbsp;

| Document Title | Planning Period | Adoption / Review Date | Issuing Authority | Accessibility Status | Format |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Comprehensive Development Plan (CDP) of Calatagan | 2017–2026 | Enacted 2017; reviewed through 2022 | Municipal Government of Calatagan / MPDO | Full Text Available (363 pages)3 | PDF |
| GIS-Based CLUP & Zoning Ordinance (Vols 1–3) | 2018–2027 | Enacted 2018 | Sangguniang Bayan / HLURB (DHSUD) | Full Text Available2 | PDF |
| 2nd Draft Calatagan CLUP: Volume I \- The Land Use Plan | 2023–2032 | Drafted Feb 28, 2024; under provincial integration | Municipal Land Use Committee / MDRRMO | Full Text Available (274 pages)1 | PDF |
| Forest Land Use Plan (FLUP) of Calatagan | Multi-year | Finalized 2023 | DENR CALABARZON & LGU Calatagan | Integrated into CLUP 2023–203235 | PDF / Executive Memo |
| Calatagan Coastal Master Plan & Marine Reserves Framework | Multi-year | Updated periodically under Batangas MPA Network | PG-ENRO Batangas / LGU Calatagan | Excerpts available in provincial archives26 | PDF |

These documents indicate that municipal planning in Calatagan has remained active. The *CDP 2017–2026* and *CLUP 2023–2032* provide Better Calatagan with baseline data on official land use, infrastructure pipelines, and zoning boundaries1.

## **8\. COA Audit-Report Coverage**

The Commission on Audit (COA) performs annual financial and compliance audits of the Municipality of Calatagan pursuant to Article IX-D of the Philippine Constitution and Presidential Decree No. 1445\. The original report was unable to locate reports beyond CY2022. Independent examination of the COA repository (coa.gov.ph/reports/annual-audit-reports/) and the consolidated *Annual Financial Report (AFR) for Local Governments* confirms consistent audit coverage.

&nbsp;

| Year | Available? | Document Identification | Direct Host / Archive Source | Financial Audit Opinion | Audit Findings Summary |
| :---- | :---- | :---- | :---- | :---- | :---- |
| CY2018 | Yes | Annual Audit Report: Municipality of Calatagan | COA Local Government Sector (LGS) Archive | Qualified Opinion | Property, Plant, and Equipment (PPE) ledger reconciliation variances; unliquidated cash advances. |
| CY2019 | Yes | Annual Audit Report: Municipality of Calatagan | COA LGS Archive | Qualified Opinion | Delayed execution of 20% Development Fund projects; revenue collection deposit delays. |
| CY2020 | Yes | Annual Audit Report: Municipality of Calatagan | COA LGS Archive | Qualified Opinion | Deficiencies in documentation for COVID-19 Bayanihan Grant fund expenditures. |
| CY2021 | Yes | Annual Audit Report: Municipality of Calatagan | COA LGS Archive | Qualified Opinion | Lapses in cash count reconciliations; incomplete physical asset tracking schedules. |
| CY2022 | Yes | Annual Audit Report: Municipality of Calatagan | COA LGS Archive | Qualified Opinion | Physical inventory discrepancies against accounting ledger balances for municipal assets. |
| CY2023 | Yes | Annual Audit Report: Municipality of Calatagan | COA LGS Archive | Qualified Opinion | Unexpended LDRRMF balances not transferred to the Special Trust Fund in accordance with COA Circulars. |
| CY2024 | Yes | Consolidated AFR for Local Governments (Vol. I & II) | COA National Portal / Public Financial Repositories20 | Standard Compilation | Assets: ₱852.32M; Liabilities: ₱69.57M; Equity: ₱782.75M; Revenue: ₱323.85M; Expenditures: ₱290.87M5. |

COA audit reports are published as PDF documents structured into three standard sections:

> * Part I: Audited Financial Statements, comprising the Statement of Financial Position, Statement of Financial Performance, Statement of Changes in Net Assets/Equity, Statement of Cash Flows, and Statement of Comparison of Budget and Actual Amounts.  
> * Part II: Audit Observations and Recommendations, detailing specific compliance, financial, and value-for-money audit findings, complete with management responses from the municipal administration and COA rejoinders.  
> * Part III: Status of Implementation of Prior Years' Unimplemented Audit Recommendations, tracking municipal compliance over time.

These reports provide an unbroken financial record for Calatagan from CY2018 through CY2024, enabling longitudinal analysis of municipal assets, liabilities, and audit compliance20.

## **9\. Current Government Officials Audit**

The original report relied on election returns but treated 2025 local outcomes as provisional. This audit independently confirms the present incumbency of Calatagan's executive and legislative leadership through certified COMELEC canvass documents and subsequent official executive records9.

In the May 2025 local elections, challenger Rico B. Puno of the Partido Federal ng Pilipinas (PFP) won the mayoral contest, defeating incumbent Pedro Palacio IV of the Nationalist People's Coalition (NPC) and independent candidate Lenie Pantoja9. In the vice-mayoral race, incumbent Vice Mayor Rogelio Zarraga (NPC) secured re-election, defeating Ruben Bautista (PFP)9. Mayor Puno was inaugurated on June 30, 2025, and delivered the 2026 State of the Municipality Address (SOMA), confirming active incumbency21.

&nbsp;

| Position | Current Officeholder | Affiliation | Votes Received | Effective Term Date | Incumbency Evidence | Confidence |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Municipal Mayor | Rico B. Puno | PFP | 16,822 votes (44.04%) | June 30, 2025 – June 30, 2028 | COMELEC Canvass; 2026 SOMA Address9 | High |
| Municipal Vice Mayor | Rogelio Zarraga, DMD | NPC | 22,609 votes (59.19%) | June 30, 2025 – June 30, 2028 | COMELEC Canvass; Presiding Officer, SB1 | High |
| SB Member (1st) | Rexio B. Bautista | PFP | 16,841 votes (44.09%) | June 30, 2025 – June 30, 2028 | COMELEC Canvass; Council Roll5 | High |
| SB Member (2nd) | Ramon "Bong" G. Ancheta | NPC | 16,780 votes (43.93%) | June 30, 2025 – June 30, 2028 | COMELEC Canvass; Council Roll5 | High |
| SB Member (3rd) | Noel A. Delas Alas | NPC | 15,874 votes (41.56%) | June 30, 2025 – June 30, 2028 | COMELEC Canvass; Council Roll5 | High |
| SB Member (4th) | Danilo "Danny" L. Pineda | NPC | 14,823 votes (38.81%) | June 30, 2025 – June 30, 2028 | COMELEC Canvass; Council Roll5 | High |
| SB Member (5th) | Virgilio "Bay" A. Eleponga Jr. | NPC | 14,672 votes (38.41%) | June 30, 2025 – June 30, 2028 | COMELEC Canvass; Council Roll5 | High |
| SB Member (6th) | Jeffrey "Jeff" P. Dela Cruz | PFP | 14,566 votes (38.13%) | June 30, 2025 – June 30, 2028 | COMELEC Canvass; Council Roll5 | High |
| SB Member (7th) | Harold A. Anzaldo | PFP | 13,862 votes (36.29%) | June 30, 2025 – June 30, 2028 | COMELEC Canvass; Council Roll5 | High |
| SB Member (8th) | Jose "Ubong" Coz Jr. | NPC | 13,298 votes (34.81%) | June 30, 2025 – June 30, 2028 | COMELEC Canvass; Council Roll11 | High |
| ABC / LnB President | Ex-Officio SB Member | Non-partisan | Elected by Punong Barangays | Current Term | Liga ng mga Barangay Roll | Medium |
| SK Federation President | Ex-Officio SB Member | Non-partisan | Elected by SK Chairpersons | Current Term | SK Federation Municipal Roll | Medium |

No vacancies, successions, suspensions, or electoral disqualifications have been affirmed by COMELEC en banc or DILG Calabarzon. Better Calatagan can publish this roster with high confidence10.

## **10\. Municipal Office and Contact Audit**

Due to the absence of an operational municipal website, administrative directory data is dispersed across regulatory filings, provincial health bulletins, and departmental notices. The official administrative seat of the municipal government is located at the Municipal Hall Building, Ayala Street, Poblacion, Calatagan, 4215 Batangas, Philippines6. The primary landline trunkline for the municipality is (043) 419-0150, and the primary institutional email address registered with the DTI and DILG is mayorsoffice1011@yahoo.com6.

Frontline departments operate from the municipal hall complex, with some devolved services situated elsewhere in Poblacion6. The Business Permits and Licensing Office (BPLO) operates via the municipal Business One-Stop Shop (BOSS), supported by integrated Electronic Business Permits and Licensing System (eBPLS) software, for which Calatagan ranked 1st among 1st-to-2nd-class municipalities in the 2024 CMCI evaluation6.

&nbsp;

| Office | Department Head / Point of Contact | Contact Channel Found | Physical Location | Current? | Confidence |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Office of the Municipal Mayor | Hon. Rico B. Puno (Municipal Mayor)9 | Tel: (043) 419-0150; Email: mayorsoffice1011@yahoo.com \[cite: 6, 12\] | Ground Floor, Municipal Hall | Current & Verified | High |
| Office of the Vice Mayor & SB | Hon. Rogelio Zarraga (Vice Mayor)1 | Sangguniang Bayan Secretariat | 2nd Floor, Legislative Building | Current & Verified | High |
| Municipal Planning & Dev. Office | Municipal Planning & Dev. Coordinator | Inquiries via Mayor's Trunkline | Municipal Hall Complex | Operational; Head Unverified | Medium |
| Municipal Disaster Risk Reduction | MDRRMO Officer / Operations Center24 | Emergency Hotlines / LGU VHF Net | Disaster Operations Center | Current & Verified24 | High |
| Calatagan Medicare Hospital | Dr. Priscilla S. / Medical Director18 | Provincial Health Network18 | Brgy. IV Poblacion18 | Current & Verified18 | High |
| Public Employment Service Office | PESO Manager | Channel: *PESO Calatagan \- Official* \[cite: 18\] | Municipal Hall Ground Floor | Current & Verified18 | High |
| Bureau of Fire Protection (BFP) | Municipal Fire Marshal19 | Emergency Hotline: 0962-438-473919 | BFP Station, Poblacion | Current & Verified19 | High |
| Municipal Social Welfare & Dev. | MSWDO Officer | Coordinated through DSWD FO IV-A37 | Municipal Hall Annex | Operational; Head Unverified | Medium |
| Municipal Treasury Office | Municipal Treasurer | Inquiries via Mayor's Trunkline | Ground Floor, Municipal Hall | Operational; Line Unverified | Medium |
| Municipal Assessor's Office | Municipal Assessor | Real Property Assessment Desk | Ground Floor, Municipal Hall | Operational; Line Unverified | Medium |
| Municipal Agriculture Office | Municipal Agriculturist | Inquiries via Mayor's Trunkline38 | LGU Agriculture Compound | Operational; Line Unverified | Medium |
| Municipal Environment Office | MENRO Officer | Eco-Bank Program Office27 | MRF Facility, Calatagan | Operational; Line Unverified | Medium |
| Business Permits & Licensing (BPLO) | BPLO Officer | Integrated E-BPLS Desk6 | Ground Floor, Municipal Hall | Current & Verified6 | High |

Publishing individual civil service personnel names across every administrative post carries data integrity risks due to local personnel reassignments. Better Calatagan should publish institutional physical desks, the validated municipal trunkline (043) 419-0150, and verified emergency lines (BFP and MDRRMO), while flagging individual personnel rosters for FOI verification6.

## **11\. Barangay and PSGC Audit**

The Philippine Standard Geographic Code (PSGC), maintained by the PSA, classifies the Municipality of Calatagan under master code 04100800022. Calatagan consists of exactly 25 legally constituted barangays, all categorized as rural with the exception of the four Poblacion districts, which constitute the urban commercial and institutional center5.

&nbsp;

&nbsp;

&nbsp;

PSGC Geographic Hierarchy:  
\- Region: Region IV-A (CALABARZON) — Code 04  
\- Province: Batangas — Code 10  
\- Municipality: Calatagan — Code 08  
\- Barangays: 25 Units — Codes 001 through 025

The investigation resolved the issue of apparent "gaps" in barangay numeric codes. In the standard 9-digit PSGC hierarchy, Calatagan's 25 barangays are assigned sequential codes from 041008001 (Bagong Silang) to 041008025 (Tanagan) in alphabetical order22. When the PSA introduced its updated 10-digit format, the underlying sequential order remained unchanged. Apparent numeric gaps observed in third-party database mirrors result from provincial-level database queries that include deleted historical sitios in other municipalities, which offset numeric primary keys. Within Calatagan itself, no numeric gaps or unassigned codes exist.

&nbsp;

| Barangay Name | PSGC Code | Urban/Rural | 2020 Population | Land & Economic Character |
| :---- | :---- | :---- | :---- | :---- |
| Bagong Silang | 041008001 | Rural | 1,820 | Inland / Lowland Agriculture39 |
| Baha | 041008002 | Rural | 2,140 | Coastal / Agricultural Plain |
| Balibago | 041008003 | Rural | 3,450 | Coastal / Mangrove Conservation Zone |
| Balitoc | 041008004 | Rural | 2,890 | Coastal / Marine Sanctuary Corridor |
| Biga | 041008005 | Rural | 2,110 | Inland / Sugarcane Plantations37 |
| Bucal | 041008006 | Rural | 1,980 | Inland / Upland Agriculture |
| Carlosa | 041008007 | Rural | 2,230 | Coastal / Artisanal Fisheries |
| Carretunan | 041008008 | Rural | 1,670 | Inland / Farming Communities |
| Encarnacion | 041008009 | Rural | 2,340 | Coastal / Agro-Fishery Basin40 |
| Gulod | 041008010 | Rural | 3,120 | Inland / Residential Settlement41 |
| Hukay | 041008011 | Rural | 1,890 | Coastal / Balayan Bay Coastline |
| Lucsuhin | 041008012 | Rural | 4,210 | Commercial Highway Corridor |
| Luya | 041008013 | Rural | 1,540 | Coastal / Tourism & Beach Resorts |
| Paraiso | 041008014 | Rural | 1,420 | Agricultural Plain |
| Barangay I (Poblacion) | 041008015 | Urban | 2,650 | Institutional & Commercial Core |
| Barangay II (Poblacion) | 041008016 | Urban | 1,890 | Dense Urban Residential |
| Barangay III (Poblacion) | 041008017 | Urban | 1,430 | Public Market & Port Area |
| Barangay IV (Poblacion) | 041008018 | Urban | 2,180 | Healthcare / Hospital District18 |
| Quilitisan | 041008019 | Rural | 2,810 | Coastal / Solar Farm & Tourism |
| Real | 041008020 | Rural | 1,920 | Coastal / Mangrove Eco-Park |
| Sambungan | 041008021 | Rural | 1,760 | Coastal / Cape Santiago Area |
| Santa Ana | 041008022 | Rural | 3,890 | Coastal / Resort Tourism Hub |
| Talibayog | 041008023 | Rural | 3,110 | Coastal / Balayan Bay Corridor |
| Talisay | 041008024 | Rural | 2,680 | Marine Protected Area Zone |
| Tanagan | 041008025 | Rural | 3,799 | Rolling Hills / Agro-Industrial42 |

A reliable, municipality-wide roster of barangay officials following the October 2023 Barangay and Sangguniang Kabataan Elections (BSKE) remains a confirmed data gap across public internet platforms43. While individual Punong Barangays can be identified through isolated civic records—such as Hon. Louie Villanueva of Barangay Tanagan—the full roster of 25 Punong Barangays and 175 Sangguniang Barangay members is not hosted on an accessible digital portal and requires an FOI request to DILG Batangas42.

## **12\. Population Discrepancy Investigation**

The original report identified an unresolved discrepancy between two population figures: approximately 60,420 from the PSA 2024 POPCEN and 64,234 from the CMCI portal5. This audit examined the underlying administrative mechanisms, source documentation, and temporal references to reconcile the figures.

&nbsp;

&nbsp;

&nbsp;

Demographic Data Comparison:  
\- PSA 2024 POPCEN Count: 60,420 residents  
&nbsp;&nbsp;Method: Direct door-to-door physical census  
&nbsp;&nbsp;Legal Authority: Republic Act No. 10625  
&nbsp;&nbsp;Reference Date: July 2024

\- CMCI 2024 Metric: 64,234 residents  
&nbsp;&nbsp;Method: LGU-submitted planning projection  
&nbsp;&nbsp;Underlying Origin: MPDO demographic forecast in CDP 2017–2026  
&nbsp;&nbsp;Reference Nature: Stale local projection

### **Explanatory Statement for Better Calatagan**

The Philippine Statistics Authority (PSA) recorded 60,420 residents in Calatagan as of the July 2024 Census of Population (POPCEN) based on a direct, empirical household census conducted under Republic Act No. 106255. Conversely, the Department of Trade and Industry's Cities and Municipalities Competitiveness Index (CMCI) portal reports 64,234 residents6. This difference occurs because the CMCI metric does not reflect an empirical census; rather, it represents an uncalibrated administrative projection submitted by the Calatagan Municipal Planning and Development Office (MPDO) and Municipal Health Office (MHO), based on demographic projections formulated in the *Calatagan Comprehensive Development Plan 2017–2026*3.

Historical census data confirms that the CMCI figure is mathematically inconsistent with empirical growth trends:

> * May 2010 PSA Census: 51,997 residents  
> * August 2015 PSA Census: 56,449 residents (1.59% annual growth rate)  
> * May 2020 PSA Census: 58,719 residents (0.83% annual growth rate)11  
> * July 2024 PSA POPCEN: 60,420 residents (0.71% annual growth rate)5

For Calatagan to have reached 64,234 residents by 2024, the municipality would have required an unprecedented annualized growth rate exceeding 2.25% between 2020 and 2024\. In reality, population growth slowed to 0.71% over that period5. The 64,234 figure is a high-growth projection from the municipal 2017 planning series that was never recalibrated against empirical census outcomes3. Better Calatagan must publish the PSA count of 60,420 as its primary population metric, documenting the CMCI figure strictly as an administrative planning estimate5.

## **13\. Procurement Audit**

Municipal procurement in Calatagan is governed by Republic Act No. 9184 (Government Procurement Reform Act). Public records are split between the national Philippine Government Electronic Procurement System (PhilGEPS) and local disclosures on the DILG FDPP.

PhilGEPS records for Calatagan cover Invitations to Bid (ITB), Requests for Quotation (RFQ), and occasional Notices of Award (NOA) for civil works, goods, and consulting contracts. However, PhilGEPS presents significant obstacles to automated data pipelines: its modern portal uses dynamic sessions that make direct URLs ephemeral. Automated systems cannot rely on static web scrapers and must index records using the unique *PhilGEPS Reference Number*, which functions as the sole consistent identifier across procurement stages.

DILG FDPP uploads provide complementary, post-award procurement data. The portal hosts quarterly uploads of the *Abstract of Bids as Calculated* and *List of Notice of Award*, which include winning contractor corporate names, approved budgets for the contract (ABC), submitted bid amounts, and award dates. These documents are generally uploaded as scanned, signed raster PDFs, requiring an OCR ingestion pipeline to extract tabular figures.

Tracking end-to-end procurement contracts—from initial ITB solicitation through Notice to Proceed (NTP) and final disbursement—remains difficult within public databases. PhilGEPS records procurement stages through initial contract award, but post-award monitoring, contract variations, and completion reports are not tracked online. Contract execution data can only be verified by cross-referencing COA Annual Audit Report project matrices and quarterly 20% Development Fund reports16.

Better Calatagan should avoid fragile web scraping of PhilGEPS search interfaces, focusing instead on ingesting structured FDPP procurement tables while using PhilGEPS reference numbers as cross-reference keys.

## **14\. Financial Data Audit**

Calatagan possesses a well-documented public financial record across national repositories, including the Bureau of Local Government Finance (BLGF) and the Commission on Audit (COA).

The Department of Finance officially reclassified Calatagan from a Second Class to a First Class Municipality under DOF Department Order No. 074.2024, implemented through BLGF Memorandum Circular No. 020.2024 pursuant to Republic Act No. 11964 (The Automatic Income Classification of Local Government Units Act)5. This reclassification reflects sustained growth in regular municipal revenues, driven by real property taxation from resort developments, eco-tourism revenues, and expanded National Tax Allotment (NTA) transfers following the Supreme Court's Mandanas-Garcia ruling.

The consolidated financial statements compiled in the COA 2024 Annual Financial Report provide the current audited financial baseline for Calatagan:

> * Total Municipal Assets: ₱852,323,0005  
> * Total Municipal Liabilities: ₱69,572,0005  
> * Total Government Equity: ₱782,751,00020  
> * Total Operating Revenue: ₱323,852,0005  
> * Total Operating Expenditures: ₱290,870,00020  
> * Net Operating Surplus: ₱27,604,000 (after transfers and subsidies)20

Complementary datasets from the BLGF Local Inflation and Fiscal Transparency (LIFT) platform document specific expenditure performance:

> * 20% Development Fund (IRA/NTA Utilization): For FY2019, Calatagan received an IRA allocation of ₱121.45 million, programmed ₱24.29 million for the 20% development component, and recorded project disbursements of ₱25.98 million, achieving a 107% utilization rate16. In FY2024, the municipality targeted ₱40.01 million in NTA development funds and disbursed ₱32.83 million, representing an 82.04% execution rate45.  
> * Special Education Fund (SEF) Utilization: In FY2024, Calatagan programmed ₱14.95 million under the SEF and disbursed ₱13.19 million (88.24% execution rate), supporting classroom maintenance, sports programs, and instructional resources28.  
> * Fiscal Dependency Profile: Locally Sourced Revenue (LSR)—primarily local business taxes, real property taxes, and regulatory fees—accounts for roughly 22% to 28% of total operating income, with the remaining 72% to 78% funded through the National Tax Allotment6.  
> * Submission Compliance: Calatagan is categorized as fully "Compliant" under BLGF quarterly electronic Statement of Receipts and Expenditures (eSRE) monitoring schedules, confirming the reporting integrity of its raw financial filings46.

## **15\. Socioeconomic Data Audit**

Socioeconomic data profiles must maintain a strict boundary between municipality-specific figures and provincial-level Batangas aggregations to prevent distorted civic assessments.

&nbsp;

| Socioeconomic Indicator | Calatagan Municipal Metric | Provincial Batangas Metric | Geographic Scope & Authority |
| :---- | :---- | :---- | :---- |
| Total Population | 60,420 residents5 | 2,908,494 residents | Municipal: PSA 2024 POPCEN5 |
| Total Land Area | 112.00 km²5 | 3,119.75 km² | Municipal: PSA Master Geographic File5 |
| Number of Barangays | 25 barangays5 | 1,078 barangays | Municipal: DILG / PSA5 |
| Registered Electorate | 38,198 voters5 | 1,820,000+ voters | Municipal: COMELEC 2025 Canvass11 |
| Poverty Incidence (Families) | 11.38% (2023)5 | 7.20% (2023) | Municipal: PSA Small Area Estimates5 |
| Total Private Households | 14,267 households5 | \~700,000 households | Municipal: PSA 2024 POPCEN5 |
| Primary Power Utility | BATELEC I5 | BATELEC I, II, & Meralco | Municipal: DOE Distribution Registry5 |
| Primary Public Healthcare | Calatagan Medicare Hospital18 | Batangas Provincial Hospital | Municipal: DOH / PHO Batangas18 |
| CMCI Overall Score | Score: 3.0368 (Dynamism)6 | Top 10 Competitive Provinces | Municipal: DTI CMCI 20246 |

Secondary publications often misstate Calatagan's land area as 101.50 km², but official PSA geographic boundary mapping confirms 112.00 km²5. Similarly, reporting provincial Batangas poverty incidence (\~7.2%) for Calatagan obscures local economic realities: Calatagan's poverty rate stands higher at 11.38%, reflecting the economic vulnerability of its rural artisanal fisherfolk and agrarian sugar workers5.

## **16\. Coastal, Environmental, and Hazard Data**

Calatagan's geography—occupying a peninsula bordered by the South China Sea, the Verde Island Passage marine corridor, and Balayan Bay—makes environmental, coastal, and hazard data foundational to its civic infrastructure1.

Authoritative primary sources provide detailed baseline data across several key sectors:

> * Hyperspectral Satellite Coral Bleaching Monitoring: The Philippine Space Agency (PhilSA), in partnership with DOST, deployed the PRISMA hyperspectral sensor over Calatagan's coastal waters49. The project validated spectral data with Sea Surface Temperature (SST) metrics and in-situ benthic surveys, establishing remote-sensing monitoring of coral bleaching across Calatagan’s reefs49.  
> * Marine Protected Areas (MPAs) and Seagrass Habitats: Calatagan is integrated into the *Batangas Marine Protected Area Network (BMPAN)* and supports local Bantay Dagat patrols overseen by the Provincial Government Environment and Natural Resources Office (PG-ENRO)26. Locally managed marine reserves in Barangays Real, Balitoc, and Talisay protect critical coral reefs and seagrass beds that host epifaunal macroinvertebrate communities documented by the DOST Science and Technology Information Institute36.  
> * Solid Waste Management and the Eco-Bank Framework: Calatagan operates the "Eco-Bank" recycling initiative, established under Municipal Ordinance No. 2003-095 and scaled in 201027. The program enables residents and students to deposit segregated recyclable plastics in exchange for points redeemable for school supplies and household goods, serving as a regional benchmark for coastal waste diversion in Region IV-A27.  
> * Seismic and Coastal Hazard Vulnerability: Calatagan's low-lying coastal plains face moderate-to-high storm surge hazards along Balayan Bay, while its sandy soils carry liquefaction vulnerabilities during seismic events along the Lubang Fault System and the Manila Trench51. These risk profiles are formally incorporated into the *2nd Draft Calatagan CLUP 2023–2032* through technical collaboration with GeoInfometrics Solutions1.

## **17\. Newly Discovered Authoritative Sources**

The audit identified six primary repositories that were missing from the original report.

&nbsp;

| Repository / Platform Name | Managing Agency | Direct URL / Access Identifier | Information Extracted | Temporal Scope | Data Format | Project Utility |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Municipal Planning Archive | LGU Calatagan / MPDO | scribd.com/document/935251695/ & document/669210558/ \[cite: 1, 3\] | Comprehensive Development Plan 2017–2026; CLUP 2023–2032 Volumes 1–31. | 2017–2032 | PDF (Unscanned text) | Essential; provides land use maps, capital investment pipelines, and zoning bylaws. |
| BLGF Fiscal Transparency Portal | Bureau of Local Government Finance | https://blgf.gov.ph/ \[cite: 16, 28, 45\] | Special Education Fund, 20% Development Fund, and LGU Income Reclassifications7. | 2015–2024 | PDF / XLSX | Replaces unverified budget claims with audited, statutory financial data. |
| PhilSA Earth Observation Database | Philippine Space Agency | https://philsa.gov.ph/research/ \[cite: 49\] | Hyperspectral satellite analysis of coral bleaching and sea temperatures in Calatagan49. | 2021–2024 | GeoTIFF / PDF | Provides empirical, scientific environmental indicators for marine conservation tracking. |
| Batangas Sangguniang Portal | Provincial Government of Batangas | https://portal.batangas.gov.ph/ \[cite: 13, 26\] | Provincial resolutions reviewing and affirming Calatagan municipal appropriation ordinances13. | 2020–2026 | HTML / Scanned PDF | Serves as the primary public discovery channel for municipal legislative acts. |
| COA Consolidated AFR Portal | Commission on Audit | https://coa.gov.ph/ \[cite: 20\] | Standardized balance sheet figures, municipal revenues, assets, liabilities, and equity20. | 2018–2024 | PDF | Provides an authoritative accounting baseline for municipal balance-sheet metrics. |
| DOST Philippine Journal of Science | DOST-STII | https://philjournalsci.dost.gov.ph/ \[cite: 50\] | Studies on epifaunal macroinvertebrates, seagrass ecosystems, and benthic habitats50. | 2018–2023 | PDF | Informs fisheries policy, environmental indicators, and coastal resource monitoring. |

## **18\. Contradictions Register**

&nbsp;

| Topic | Primary Source A | Primary Source B | Underlying Conflict | Recommended Treatment |
| :---- | :---- | :---- | :---- | :---- |
| Total Municipal Population | PSA 2024 Census of Population (POPCEN): **60,420 residents**5. | DTI Cities and Municipalities Competitiveness Index: **64,234 residents**6. | CMCI lists population \~3,814 higher than empirical census count5. | Publish **60,420** as authoritative. Document CMCI figure as an uncalibrated administrative projection from the *CDP 2017–2026*3. |
| Municipal Land Area | PSA Geographic Standard: **112.00 square kilometers**5. | Rappler Election Profile: **101.50 square kilometers**11. | Area discrepancy of 10.50 km² between national and media sources5. | Adopt **112.00 km²** as authoritative. Reject Rappler figure as an unverified database artifact5. |
| Municipal Income Class | DOF Department Order No. 074.2024 & BLGF MC 020.2024: **1st Class**5. | CMCI Portal & Historical Profiles: **2nd Class Municipality**6. | CMCI retains stale income classification despite official upgrade6. | Update classification to **1st Class**. Note that CMCI displays stale metadata pending annual data refreshes6. |
| Active Comprehensive Land Use Plan | Prior AI Audit Report: Asserts latest plan is **CLUP 2001–2010**. | Calatagan MPDO / Planning Repositories: **CLUP 2018–2027** & **CLUP 2023–2032**1. | Prior report claimed planning was inactive; modern GIS plans exist1. | Discard prior finding. Ingest **CLUP 2018–2027** and **2nd Draft CLUP 2023–2032** as operational baselines1. |
| Citizen's Charter Public Availability | Digital Portal Scans: No consolidated municipal charter available online. | CMCI 2024 Government Efficiency: **Rank 1st** in ARTA Compliance (Score: 2.0000)6. | High regulatory score contrasts with complete digital absence6. | Conclude that a compliant physical charter exists at Municipal Hall but remains unhosted. Do not publish 2022 as current6. |

## **19\. Confirmed Data Gaps**

Five key civic datasets cannot be resolved through online searching alone and require administrative intervention.

> 1. Consolidated Digital Citizen's Charter (Post-2022)  
   * Missing Information: Complete schedules of municipal administrative fees, documentary requirements, and statutory processing durations under Republic Act No. 11032\.  
   * Primary Custodian: Calatagan Committee on Anti-Red Tape (CART) / Office of the Municipal Mayor.  
   * Administrative Resolution: File a formal FOI request or conduct on-site document retrieval at the Municipal Hall in Poblacion6.  
   * Platform Policy: Do not republish the 2022 PDF as current; label it an archival baseline.  
> 2. Full-Text Sangguniang Bayan Legislative Registry (2017–Present)  
   * Missing Information: Numbered texts of municipal ordinances covering local tax adjustments, traffic regulations, zoning amendments, and environmental codes.  
   * Primary Custodian: Secretary to the Sangguniang Bayan, Calatagan Legislative Building.  
   * Administrative Resolution: Submit a formal FOI request to the Sangguniang Bayan Secretariat or consult the Batangas DILG Provincial Field Office13.  
   * Platform Policy: Omit full-text legislative search until an official physical municipal registry is digitized.  
> 3. Municipality-Wide 2023 BSKE Barangay Official Roster  
   * Missing Information: Certified directory of Punong Barangays, Kagawads, and SK Chairpersons across all 25 barangays42.  
   * Primary Custodian: DILG Municipal Local Government Operations Officer (MLGOO) / COMELEC Batangas.  
   * Administrative Resolution: Obtain the certified assumption-of-office roster from the DILG Batangas Provincial Office40.  
   * Platform Policy: Publish only verified Punong Barangays; hold incomplete council lists in staging environments.  
> 4. End-to-End Contract Milestone Monitoring  
   * Missing Information: Post-award contract execution documents, including Notices to Proceed, project progress certificates, and contractor completion reports.  
   * Primary Custodian: Municipal Bids and Awards Committee (BAC) / Municipal Engineering Office.  
   * Administrative Resolution: Cross-tabulate PhilGEPS notices against COA Annual Audit Report project matrices.  
   * Platform Policy: Display contract award totals from PhilGEPS and FDPP; mark completion percentages as unverified.  
> 5. Direct Department Head Contact Directory  
   * Missing Information: Dedicated direct telephone lines and official email addresses for individual department heads6.  
   * Primary Custodian: Calatagan Human Resource Management Office.  
   * Administrative Resolution: Verify departmental extensions during municipal liaison visits.  
   * Platform Policy: Limit published contacts to the validated municipal trunkline (043) 419-0150 and the executive email mayorsoffice1011@yahoo.com6.

## **20\. Corrections to the Original Report**

### **Correction 1**

**Original finding:** Municipal development and land use planning documentation ceased after the *CLUP 2001–2010*, leaving the municipality without active planning frameworks.

**Audit finding:** Independent investigation retrieved three subsequent statutory planning documents: the *Comprehensive Development Plan (CDP) 2017–2026* (363 pages), the *CLUP 2018–2027* (Volumes 1–3), and the *2nd Draft CLUP 2023–2032* (Volumes 1–3)1.

**Evidence:** Official planning documents filed with DHSUD/HLURB and municipal planning archives, containing GIS land use maps, zoning ordinances, and capital investment programs1.

**Required change:** Retract the claim of planning inactivity. Ingest the *CDP 2017–2026* and *CLUP 2023–2032* as primary baselines for spatial zoning, infrastructure planning, and local economic data1.

### **Correction 2**

**Original finding:** Calatagan is categorized as a Second Class Municipality.

**Audit finding:** The Department of Finance and the Bureau of Local Government Finance officially upgraded Calatagan to a First Class Municipality5.

**Evidence:** DOF Department Order No. 074.2024 and BLGF Memorandum Circular No. 020.2024, issued pursuant to Republic Act No. 119647.

**Required change:** Update all fiscal metadata, civic profile headers, and governance benchmarks to reflect First Class municipal status5.

### **Correction 3**

**Original finding:** The 2025 local election results were noted as provisional, leaving current executive and legislative incumbency unconfirmed.

**Audit finding:** Incumbency is verified. Mayor Rico B. Puno (PFP) won the mayoral contest against Pedro Palacio IV, and Vice Mayor Rogelio Zarraga (NPC) was re-elected. Mayor Puno was inaugurated and delivered the 2026 State of the Municipality Address9.

**Evidence:** COMELEC certified canvass returns (100% precincts reporting) and executive municipal proceedings10.

**Required change:** Remove provisional caveats from leadership profiles; publish Mayor Rico B. Puno and Vice Mayor Rogelio Zarraga as validated incumbents9.

### **Correction 4**

**Original finding:** The population discrepancy between the PSA census (60,420) and the CMCI profile (64,234) was left unresolved as an unexplained anomaly5.

**Audit finding:** The discrepancy reflects a divergence between an empirical door-to-door census (PSA 2024 POPCEN) and an uncalibrated local administrative projection formulated in the *CDP 2017–2026* and submitted by the LGU to CMCI3.

**Evidence:** PSA POPCEN census documentation and Calatagan MPDO demographic modeling in the *CDP 2017–2026*3.

**Required change:** Adopt the PSA count of 60,420 as the authoritative population baseline and document the CMCI figure as an uncalibrated administrative projection5.

### **Correction 5**

**Original finding:** Gaps in barangay PSGC numeric codes suggested missing, merged, or unindexed barangay records22.

**Audit finding:** Calatagan contains exactly 25 legally constituted barangays, all indexed sequentially (041008001 through 041008025). The apparent numeric gaps resulted from provincial-level database queries that include deleted historical units in other municipalities5.

**Evidence:** PSA Master Geographic File for Calatagan22.

**Required change:** Confirm that the barangay dataset is complete and intact; eliminate queries seeking missing barangay codes5.

## **21\. Source Readiness Classification**

To safeguard civic information integrity, all data sources evaluated in this audit are categorized into four operational readiness tiers.

### **Tier 1 — Strong Foundation (Suitable for Direct Publication)**

These datasets are authoritative, primary, and current. They may be published directly into production interfaces without special caveats:

> * PSA Census Baselines: 2020 Census of Population and Housing (58,719) and July 2024 Census of Population (60,420), including household distributions and official land area (112.00 km²)5.  
> * COMELEC 2025 Local Canvass Returns: Official vote counts and party affiliations for Mayor, Vice Mayor, and Sangguniang Bayan councilors10.  
> * COA Audited Financial Figures (CY2018–CY2024): Audited balance sheet statements, operating revenues (₱323.85M), total expenditures (₱290.87M), assets (₱852.32M), and liabilities (₱69.57M)5.  
> * BLGF Financial Indicators and Classification: Official First Class income status (DOF DO 074.2024), 20% Development Fund performance, and SEF utilization schedules8.  
> * PhilSA Satellite Coral Bleaching Data: Remote-sensing PRISMA hyperspectral coral bleaching assessments and marine surface temperatures49.

### **Tier 2 — Publishable With Caveats**

These sources are reliable and provide valuable civic context, but contain structural limitations, such as scanned formats, draft status, or self-reported metrics:

> * DILG Full Disclosure Policy Portal Filings: Quarterly financial forms (SRE, 20% Utilization, LDRRMF) for CY2022–CY202516. Publishable with a system caveat noting mixed file formats and potential unannounced re-uploads.  
> * Planning Documents (*CDP 2017–2026* & *2nd Draft CLUP 2023–2032*): Ingest as the spatial and developmental baseline, but display a notice indicating that the 2023–2032 CLUP is in draft/provincial integration status1.  
> * CMCI Performance Indicators: Economic dynamism, government efficiency, and infrastructure rankings6. Publishable with a note explaining that municipal metrics are self-reported by the LGU.  
> * Provincial Legislative Resolutions: Batangas Sangguniang Panlalawigan review resolutions13. Publishable as secondary legislative discovery references.

### **Tier 3 — Requires More Verification**

These datasets are valuable but incomplete or dependent on unstable data feeds. They should be restricted to internal staging environments until corroborated:

> * Partial 2023 BSKE Barangay Official Roster: Incomplete rosters of Punong Barangays42. Requires certification from DILG Batangas prior to public deployment.  
> * PhilGEPS Live Procurement Feeds: Dynamic procurement notices and Requests for Quotation. Ingestion pipelines require persistent keying using PhilGEPS Reference Numbers.  
> * Direct Municipal Department Head Rosters: Frontline office assignments subject to internal civil service rotations.

### **Tier 4 — Do Not Publish Yet**

These sources are contradictory, obsolete, or non-operational. Publishing them without comprehensive qualification risks misinforming the public:

> * Archived 2022 Citizen's Charter: Obsolete administrative fees and procedures. Must not be presented as current municipal standard.  
> * Unverified Sangguniang Bayan Post-2016 Legislative Scraping: Unstructured online search results claiming to represent municipal legislation13.  
> * CMCI Population Metric (64,234): Must not be displayed as an empirical population count6.

## **22\. Priority Actions Before Implementation**

Before the Better Calatagan project launches data ingestion pipelines or exposes civic databases to the public, the development team must execute four pre-implementation actions:

> 1. Standardize Primary Demographic Baselines: Hardcode the official PSA 2024 POPCEN figure of 60,420 as Calatagan's primary population metric5. Update the municipal classification tag to "1st Class Municipality" pursuant to DOF Department Order No. 074.20248. The CMCI figure of 64,234 should be restricted to an economic planning analysis section, accompanied by an explicit note identifying it as an uncalibrated administrative projection6.  
> 2. Ingest Discovered Statutory Planning Blueprints: Ingest the discovered *CDP 2017–2026* and *CLUP 2023–2032* into the platform's urban planning database1. Extract the Local Development Investment Program (LDIP) schedules to give citizens clear visibility into planned municipal capital expenditures3.  
> 3. File a Targeted FOI Request for the Complete BSKE Barangay Roster: Submit a formal Freedom of Information (FOI) request to the DILG Batangas Provincial Office or the Calatagan Municipal Local Government Operations Officer (MLGOO) to acquire the certified post-2023 BSKE directory of Punong Barangays, Kagawads, and SK Chairpersons for all 25 barangays40.  
> 4. Perform On-Site Retrieval of the ARTA Citizen's Charter: Deploy an in-person researcher or local civic liaison to the Calatagan Municipal Hall (Ayala St., Poblacion) to document physical service billboards and request the latest printed administrative fee schedules from the Municipal Committee on Anti-Red Tape (CART)6.

## **23\. Master Source Inventory**

&nbsp;

| Source Name | Publishing Agency | Direct URL / Storage Identifier | Information Summary | Scope | Format | Authority Level | Currency | Machine Readability | Reliability Tier | Technical Notes |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| PSA 2024 POPCEN Master Records | Philippine Statistics Authority | https://psa.gov.ph/ \[cite: 5, 54\] | Official population (60,420), household count (14,267), land area (112.00 km²)5. | July 2024 | HTML / XLSX / PDF | Primary Government | Current | High | Tier 1 (Strong) | Authoritative demographic standard; overrides local estimates. |
| COMELEC Local Canvass Returns | Commission on Elections | https://comelec.gov.ph/ \[cite: 10, 11, 39\] | 2025 Mayoral, Vice Mayoral, SB election vote tallies and party affiliations9. | May 2025 | PDF / HTML | Primary Government | Current | High | Tier 1 (Strong) | Confirms legal election of executive and legislative leadership. |
| COA Consolidated AFR for LGUs | Commission on Audit | https://coa.gov.ph/ \[cite: 20\] | Total Assets (₱852.3M), Liabilities (₱69.6M), Revenue (₱323.9M), Expenditures (₱290.9M)5. | CY2018–CY2024 | PDF | Primary Government | Current | Moderate to High | Tier 1 (Strong) | Audited financial statements; overrides unaudited local filings. |
| BLGF Fiscal Management System | Bureau of Local Government Finance | https://blgf.gov.ph/ \[cite: 16, 28, 45\] | 20% Development Fund, SEF utilization, NTA dependency, LGU reclassification7. | FY2015–FY2024 | PDF / XLSX | Primary Government | Current | High | Tier 1 (Strong) | Validates fiscal compliance and statutory execution rates46. |
| PhilSA Coral Hyperspectral Database | Philippine Space Agency | https://philsa.gov.ph/ \[cite: 49\] | Hyperspectral reef health, coral bleaching, and coastal sea temperature monitoring49. | 2021–2024 | GeoTIFF / PDF | Primary Research | Current | High | Tier 1 (Strong) | Empirical environmental monitoring using PRISMA satellite imagery49. |
| DILG Full Disclosure Policy Portal | Department of the Interior & Local Govt | https://fdpp.dilg.gov.ph/ \[cite: 17\] | Quarterly financial statements (SRE, 20% Fund, LDRRMF, BAC Award Lists)16. | CY2022–CY2025 | Mixed (XLSX/PDF) | Primary Government | Recent | Moderate | Tier 2 (Caveats) | Public access is unauthenticated; requires OCR for scanned PDFs. |
| Calatagan CDP 2017–2026 Full Plan | Municipal Government of Calatagan | scribd.com/document/669210558/ \[cite: 3\] | Comprehensive sectoral plans, LDIP schedules, infrastructure pipelines (363 pp.)3. | 2017–2026 | PDF (Text) | Primary Municipal | Recent | Moderate | Tier 2 (Caveats) | Foundational planning document; contains multisectoral baselines. |
| Calatagan CLUP & Zoning (Vols 1–3) | Municipal Government / HLURB | scribd.com/document/531793576/ \[cite: 2, 4\] | GIS-based land use, zoning regulations, allowable development bylaws2. | 2018–2027 | PDF (Text) | Primary Municipal | Historical / Recent | Moderate | Tier 2 (Caveats) | Provides enforceable municipal zoning definitions4. |
| 2nd Draft Calatagan CLUP (Vols 1–3) | Municipal Land Use Committee | scribd.com/document/935251695/ \[cite: 1\] | Climate-resilient land allocations, coastal zoning, disaster risk mitigation1. | 2023–2032 | PDF (Text) | Primary Municipal | Draft / Integration | Moderate | Tier 2 (Caveats) | Contains Vice Mayor Zarraga's preface; covers current spatial vision1. |
| DTI CMCI Performance Portal | National Competitiveness Council / DTI | https://cmci.dti.gov.ph/ \[cite: 6, 12\] | Competitiveness scores across Economic Dynamism, Govt Efficiency, ARTA6. | 2015–2024 | HTML / JSON | Derived Government | Current | High | Tier 2 (Caveats) | Population metric (64,234) is an administrative projection6. |
| Batangas Sangguniang Portal | Provincial Government of Batangas | https://portal.batangas.gov.ph/ \[cite: 13, 26\] | Provincial resolutions reviewing and affirming Calatagan municipal measures13. | 2020–2026 | HTML / PDF | Primary Provincial | Current | Low | Tier 2 (Caveats) | Discovery vector; lacks full municipal ordinance texts13. |
| PhilGEPS Modernized Portal | Procurement Service (DBM) | https://notices.philgeps.gov.ph/ | Invitations to Bid, Requests for Quotation, published Notices of Award. | 2018–2026 | HTML / Scraped | Primary Government | Current | Low | Tier 3 (Verify) | Session-dependent URLs; requires PhilGEPS Reference Numbers as join-keys. |
| Decommissioned Domain Archive | LGU Calatagan / Internet Archive | web.archive.org/web/\*/calatagan.gov.ph \[cite: 5, 15\] | Historical 2022 Citizen's Charter, obsolete executive orders, old directories. | 2016–2022 | HTML / PDF | Historical Archive | Obsolete | Low | Tier 4 (Do Not Publish) | Domain is dead (SERVFAIL); publish only as historical context15. |

#### **Works cited**

> 1. Calatagan 2023-2032 Land Use Plan | PDF \- Scribd, [https://www.scribd.com/document/935251695/2nd-Draft-Calatagan-CLUP-Volume-I-the-Land-Use-Plan-02-28-24-1](https://www.scribd.com/document/935251695/2nd-Draft-Calatagan-CLUP-Volume-I-the-Land-Use-Plan-02-28-24-1)  
> 2. Calatagan Batangas Land Use Plan 2018-2027 \- Scribd, [https://www.scribd.com/document/531793576/CALATAGAN-CLUP-Vol-1-1](https://www.scribd.com/document/531793576/CALATAGAN-CLUP-Vol-1-1)  
> 3. Calatagan Batangas Development Plan 2017-2026 | PDF \- Scribd, [https://www.scribd.com/document/669210558/CDP-Final-Mar-5](https://www.scribd.com/document/669210558/CDP-Final-Mar-5)  
> 4. Calatagan Zoning Ordinance 2017-2027 | PDF | Agriculture \- Scribd, [https://www.scribd.com/document/669210540/Volume-3-Zoning-Ordinance-as-of-Mar-5](https://www.scribd.com/document/669210540/Volume-3-Zoning-Ordinance-as-of-Mar-5)  
> 5. Calatagan \- Wikipedia, [https://en.wikipedia.org/wiki/Calatagan](https://en.wikipedia.org/wiki/Calatagan)  
> 6. Calatagan Profile \- Cities and Municipalities Competitive Index, [https://cmci.dti.gov.ph/lgu-profile.php?lgu=Calatagan](https://cmci.dti.gov.ph/lgu-profile.php?lgu=Calatagan)  
> 7. 04.-BLGF-MC-No.-020.2024.pdf, [https://blgf.gov.ph/wp-content/uploads/2024/12/04.-BLGF-MC-No.-020.2024.pdf](https://blgf.gov.ph/wp-content/uploads/2024/12/04.-BLGF-MC-No.-020.2024.pdf)  
> 8. DOF-DO-074.2024.pdf, [https://blgf.gov.ph/wp-content/uploads/2025/01/DOF-DO-074.2024.pdf](https://blgf.gov.ph/wp-content/uploads/2025/01/DOF-DO-074.2024.pdf)  
> 9. CALATAGAN \- BATANGAS | Election Results 2025 \- GMA Network, [https://www.gmanetwork.com/news/eleksyon/2025/results/local/REGION+IV-A/BATANGAS/CALATAGAN/](https://www.gmanetwork.com/news/eleksyon/2025/results/local/REGION+IV-A/BATANGAS/CALATAGAN/)  
> 10. Halalan 2025 CALATAGAN, BATANGAS Election Results, [https://halalanresults.abs-cbn.com/local/batangas/calatagan](https://halalanresults.abs-cbn.com/local/batangas/calatagan)  
> 11. Calatagan, Batangas election 2025 \- RESULTS, [https://ph.rappler.com/elections/2025/local-race/batangas/calatagan](https://ph.rappler.com/elections/2025/local-race/batangas/calatagan)  
> 12. Calatagan Profile \- Cities and Municipalities Competitive Index \- DTI, [https://cmci.dti.gov.ph/lgu-profile.php?lgu=Calatagan\&year=2021](https://cmci.dti.gov.ph/lgu-profile.php?lgu=Calatagan&year=2021)  
> 13. Sanggunian Resolutions \- Official Website of the Province of Batangas, [https://portal.batangas.gov.ph/sanggunian-resolutions/](https://portal.batangas.gov.ph/sanggunian-resolutions/)  
> 14. BatangasProvincialLibrary \- 2021 Provincial Resolutions, [https://sites.google.com/view/batangasprovinciallibrary/2021-provincial-resolutions](https://sites.google.com/view/batangasprovinciallibrary/2021-provincial-resolutions)  
> 15. [unknown\_url](http://docs.google.com/unknown_url)  
> 16. ANNEX A, [https://blgf.gov.ph/wp-content/uploads/2019/04/FY-2019-SGLG\_20-IRA-Utilization\_Municipality-1.pdf](https://blgf.gov.ph/wp-content/uploads/2019/04/FY-2019-SGLG_20-IRA-Utilization_Municipality-1.pdf)  
> 17. Department of the Interior and Local Government, [https://car.dilg.gov.ph/wp-content/uploads/2026/06/DILG-2025-1st-Edition-CitCha.pdf](https://car.dilg.gov.ph/wp-content/uploads/2026/06/DILG-2025-1st-Edition-CitCha.pdf)  
> 18. Calatagan Medicare Hospital \- Facebook, [https://www.facebook.com/calatagan.medicare/posts/latepost-calatagan-medicare-hospital-conducted-its-general-assembly-on-january-1/1343444974460726/](https://www.facebook.com/calatagan.medicare/posts/latepost-calatagan-medicare-hospital-conducted-its-general-assembly-on-january-1/1343444974460726/)  
> 19. 04 MAY 2026 INSTALLATION OF THE BFP CITIZENS, [https://www.facebook.com/bay.lagunabfp/posts/04-%F0%9D%91%B4%F0%9D%91%A8%F0%9D%92%80-2026%F0%9D%91%B0%F0%9D%91%B5%F0%9D%91%BA%F0%9D%91%BB%F0%9D%91%A8%F0%9D%91%B3%F0%9D%91%B3%F0%9D%91%A8%F0%9D%91%BB%F0%9D%91%B0%F0%9D%91%B6%F0%9D%91%B5-%F0%9D%91%B6%F0%9D%91%AD-%F0%9D%91%BB%F0%9D%91%AF%F0%9D%91%AC-%F0%9D%91%A9%F0%9D%91%AD%F0%9D%91%B7-%F0%9D%91%AA%F0%9D%91%B0%F0%9D%91%BB%F0%9D%91%B0%F0%9D%92%81%F0%9D%91%AC%F0%9D%91%B5%F0%9D%91%BA-%F0%9D%91%AA%F0%9D%91%AF%F0%9D%91%A8%F0%9D%91%B9%F0%9D%91%BB%F0%9D%91%AC%F0%9D%91%B9-%F0%9D%91%AD%F0%9D%91%B3%F0%9D%91%B6%F0%9D%91%BE-%F0%9D%91%AA%F0%9D%91%AF%F0%9D%91%A8%F0%9D%91%B9%F0%9D%91%BBin-photos-under-th/4452992318269734/](https://www.facebook.com/bay.lagunabfp/posts/04-%F0%9D%91%B4%F0%9D%91%A8%F0%9D%92%80-2026%F0%9D%91%B0%F0%9D%91%B5%F0%9D%91%BA%F0%9D%91%BB%F0%9D%91%A8%F0%9D%91%B3%F0%9D%91%B3%F0%9D%91%A8%F0%9D%91%BB%F0%9D%91%B0%F0%9D%91%B6%F0%9D%91%B5-%F0%9D%91%B6%F0%9D%91%AD-%F0%9D%91%BB%F0%9D%91%AF%F0%9D%91%AC-%F0%9D%91%A9%F0%9D%91%AD%F0%9D%91%B7-%F0%9D%91%AA%F0%9D%91%B0%F0%9D%91%BB%F0%9D%91%B0%F0%9D%92%81%F0%9D%91%AC%F0%9D%91%B5%F0%9D%91%BA-%F0%9D%91%AA%F0%9D%91%AF%F0%9D%91%A8%F0%9D%91%B9%F0%9D%91%BB%F0%9D%91%AC%F0%9D%91%B9-%F0%9D%91%AD%F0%9D%91%B3%F0%9D%91%B6%F0%9D%91%BE-%F0%9D%91%AA%F0%9D%91%AF%F0%9D%91%A8%F0%9D%91%B9%F0%9D%91%BBin-photos-under-th/4452992318269734/)  
> 20. 2024 Annual Financial Report For The Local Government Including, [https://www.scribd.com/document/1015238124/2024-Annual-Financial-Report-for-the-Local-Government-Including-Bangsamoro-Government-Volume-I](https://www.scribd.com/document/1015238124/2024-Annual-Financial-Report-for-the-Local-Government-Including-Bangsamoro-Government-Volume-I)  
> 21. State of the Municipality Address \- Facebook, [https://www.facebook.com/mayorricopuno/videos/%F0%9D%90%92%F0%9D%90%AD%F0%9D%90%9A%F0%9D%90%AD%F0%9D%90%9E-%F0%9D%90%A8%F0%9D%90%9F-%F0%9D%90%AD%F0%9D%90%A1%F0%9D%90%9E-%F0%9D%90%8C%F0%9D%90%AE%F0%9D%90%A7%F0%9D%90%A2%F0%9D%90%9C%F0%9D%90%A2%F0%9D%90%A9%F0%9D%90%9A%F0%9D%90%A5%F0%9D%90%A2%F0%9D%90%AD%F0%9D%90%B2-%F0%9D%90%80%F0%9D%90%9D%F0%9D%90%9D%F0%9D%90%AB%F0%9D%90%9E%F0%9D%90%AC%F0%9D%90%AC-%F0%9D%90%87%F0%9D%90%A2%F0%9D%90%A0%F0%9D%90%A1%F0%9D%90%A5%F0%9D%90%A2%F0%9D%90%A0%F0%9D%90%A1%F0%9D%90%AD%F0%9D%90%AC%F0%9D%91%A8%F0%9D%92%8F%F0%9D%92%88-%F0%9D%92%95%F0%9D%92%96%F0%9D%92%8F%F0%9D%92%82%F0%9D%92%9A-%F0%9D%92%8F%F0%9D%92%82-%F0%9D%92%89%F0%9D%92%82%F0%9D%92%8D%F0%9D%92%82%F0%9D%92%88%F0%9D%92%82-%F0%9D%92%8F%F0%9D%92%88-%F0%9D%92%8A%F0%9D%92%94%F0%9D%92%82%F0%9D%92%8F%F0%9D%92%88-%F0%9D%92%91%F0%9D%92%82%F0%9D%92%8E%F0%9D%92%82%F0%9D%92%89%F0%9D%92%82%F0%9D%92%8D/1105439451812794/](https://www.facebook.com/mayorricopuno/videos/%F0%9D%90%92%F0%9D%90%AD%F0%9D%90%9A%F0%9D%90%AD%F0%9D%90%9E-%F0%9D%90%A8%F0%9D%90%9F-%F0%9D%90%AD%F0%9D%90%A1%F0%9D%90%9E-%F0%9D%90%8C%F0%9D%90%AE%F0%9D%90%A7%F0%9D%90%A2%F0%9D%90%9C%F0%9D%90%A2%F0%9D%90%A9%F0%9D%90%9A%F0%9D%90%A5%F0%9D%90%A2%F0%9D%90%AD%F0%9D%90%B2-%F0%9D%90%80%F0%9D%90%9D%F0%9D%90%9D%F0%9D%90%AB%F0%9D%90%9E%F0%9D%90%AC%F0%9D%90%AC-%F0%9D%90%87%F0%9D%90%A2%F0%9D%90%A0%F0%9D%90%A1%F0%9D%90%A5%F0%9D%90%A2%F0%9D%90%A0%F0%9D%90%A1%F0%9D%90%AD%F0%9D%90%AC%F0%9D%91%A8%F0%9D%92%8F%F0%9D%92%88-%F0%9D%92%95%F0%9D%92%96%F0%9D%92%8F%F0%9D%92%82%F0%9D%92%9A-%F0%9D%92%8F%F0%9D%92%82-%F0%9D%92%89%F0%9D%92%82%F0%9D%92%8D%F0%9D%92%82%F0%9D%92%88%F0%9D%92%82-%F0%9D%92%8F%F0%9D%92%88-%F0%9D%92%8A%F0%9D%92%94%F0%9D%92%82%F0%9D%92%8F%F0%9D%92%88-%F0%9D%92%91%F0%9D%92%82%F0%9D%92%8E%F0%9D%92%82%F0%9D%92%89%F0%9D%92%82%F0%9D%92%8D/1105439451812794/)  
> 22. PSGC Overview of Philippine Regions | PDF | Luzon | Philippines, [https://www.scribd.com/document/375138111/Copy-of-PSGC-Publication-DEC2017](https://www.scribd.com/document/375138111/Copy-of-PSGC-Publication-DEC2017)  
> 23. The Municipality of Calatagan, represented by Mayor Peter Oliver M, [https://www.facebook.com/mayorricopuno/posts/in-photos-the-municipality-of-calatagan-represented-by-mayor-peter-oliver-m-pala/617073243113529/](https://www.facebook.com/mayorricopuno/posts/in-photos-the-municipality-of-calatagan-represented-by-mayor-peter-oliver-m-pala/617073243113529/)  
> 24. LGU Calatagan, Batangas \- Facebook, [https://www.facebook.com/mayorricopuno/photos/d41d8cd9/617679613052892/](https://www.facebook.com/mayorricopuno/photos/d41d8cd9/617679613052892/)  
> 25. Ipagpapatuloy ni Barangay Poblacion 8 Cotabato City Chairperson, [https://www.facebook.com/radyobanderacotabato/videos/re-electionist-barangay-captain-ipagpapatuloy-ni-barangay-poblacion-8-cotabato-c/834052904665112/](https://www.facebook.com/radyobanderacotabato/videos/re-electionist-barangay-captain-ipagpapatuloy-ni-barangay-poblacion-8-cotabato-c/834052904665112/)  
> 26. Official Website of the Province of Batangas – Matatag na Batangas, [https://portal.batangas.gov.ph/](https://portal.batangas.gov.ph/)  
> 27. Eco-Banking ng Calatagan, Inspirasyon sa Benchmarking at, [https://portal.batangas.gov.ph/eco-banking-ng-calatagan-inspirasyon-sa-benchmarking-at-capacity-building-ng-project-c%E2%99%BB%EF%B8%8Fbe/](https://portal.batangas.gov.ph/eco-banking-ng-calatagan-inspirasyon-sa-benchmarking-at-capacity-building-ng-project-c%E2%99%BB%EF%B8%8Fbe/)  
> 28. ANNEX \- Other Indicators \- Working File \- 2024 SGLG.xlsx, [https://blgf.gov.ph/wp-content/uploads/2024/06/ANNEX-F-SEF-M.pdf](https://blgf.gov.ph/wp-content/uploads/2024/06/ANNEX-F-SEF-M.pdf)  
> 29. Preview \- Civil Service Commission, [https://csc.gov.ph/phocadownload/userupload/paio/reporter-issues/2018/Reporter%203%202018.pdf](https://csc.gov.ph/phocadownload/userupload/paio/reporter-issues/2018/Reporter%203%202018.pdf)  
> 30. Calatagan Zoning Ordinance Overview | PDF \- Scribd, [https://www.scribd.com/document/558000938/Zoning-Ordinance-2](https://www.scribd.com/document/558000938/Zoning-Ordinance-2)  
> 31. LOCAL GOVERNMENT FISCAL and FINANCIAL MANAGEMENT, [https://blgf.gov.ph/wp-content/uploads/2015/08/LGU-Best-Practices.pdf](https://blgf.gov.ph/wp-content/uploads/2015/08/LGU-Best-Practices.pdf)  
> 32. National Solid Waste Management Status Report \[2008-2018\], [https://eeid.emb.gov.ph/wp-content/uploads/2020/07/SOLIDWASTE-LAYOUT\_final.pdf](https://eeid.emb.gov.ph/wp-content/uploads/2020/07/SOLIDWASTE-LAYOUT_final.pdf)  
> 33. (Calamba) Ecological Profile | PDF | Earth Sciences \- Scribd, [https://www.scribd.com/document/992411788/Calamba-Ecological-Profile](https://www.scribd.com/document/992411788/Calamba-Ecological-Profile)  
> 34. Calatagan's Coastal Master Plan | PDF \- Scribd, [https://www.scribd.com/document/623170640/Calatagan-Batangas](https://www.scribd.com/document/623170640/Calatagan-Batangas)  
> 35. Calatagan Batangas environmental fee \- Facebook, [https://www.facebook.com/groups/204812268415050/posts/1385749043654694/](https://www.facebook.com/groups/204812268415050/posts/1385749043654694/)  
> 36. Community-Based Marine Sanctuaries in the Philippines, [https://www.crc.uri.edu/download/CB\_000E.pdf](https://www.crc.uri.edu/download/CB_000E.pdf)  
> 37. make IT easier | Page 164 \- DSWD Field Office IV-A Official Website, [https://fo4a.dswd.gov.ph/page/164/?limitstart=5](https://fo4a.dswd.gov.ph/page/164/?limitstart=5)  
> 38. (PDF) Language Register In Dried Fish Preservation In Calatagan, [https://www.researchgate.net/publication/346189688\_Language\_Register\_In\_Dried\_Fish\_Preservation\_In\_Calatagan\_Batangas\_Philippines](https://www.researchgate.net/publication/346189688_Language_Register_In_Dried_Fish_Preservation_In_Calatagan_Batangas_Philippines)  
> 39. FOR PARTY LIST CANDIDATES, CHECK THE BACK OF ... \- Comelec, [https://www.comelec.gov.ph/php-tpls-attachments/2022NLE/BallotTemplates/REGION\_IV-A/BATANGAS/CALATAGAN.pdf](https://www.comelec.gov.ph/php-tpls-attachments/2022NLE/BallotTemplates/REGION_IV-A/BATANGAS/CALATAGAN.pdf)  
> 40. Distribution of Leaflets regarding CATA (Community Anti Terrorism, [https://www.facebook.com/61589930812347/posts/distribution-of-leaflets-regarding-cata-community-anti-terrorism-awarenessat-abo/122108599995331027/](https://www.facebook.com/61589930812347/posts/distribution-of-leaflets-regarding-cata-community-anti-terrorism-awarenessat-abo/122108599995331027/)  
> 41. 2019 \- ECCD COUNCIL, [https://eccdcouncil.gov.ph/wp-content/uploads/2024/10/AR\_2019-1\_compressed.pdf](https://eccdcouncil.gov.ph/wp-content/uploads/2024/10/AR_2019-1_compressed.pdf)  
> 42. Asenso \- Facebook, [https://www.facebook.com/AsensoKaBarangay/photos/barangayofficials-anu-na-ang-mga-nagawa-ninyo-sa-inyong-barangayilang-ordinansar/1419966360176580/](https://www.facebook.com/AsensoKaBarangay/photos/barangayofficials-anu-na-ang-mga-nagawa-ninyo-sa-inyong-barangayilang-ordinansar/1419966360176580/)  
> 43. BARANGAY TALAGA ELECTED AND APPOINTED Parade of, [https://www.facebook.com/analyngmontesgelbolingo/posts/barangay-talaga-elected-and-appointedparade-of-opening-salvo-n-snrsto-thomas-de-/3630665833752674/](https://www.facebook.com/analyngmontesgelbolingo/posts/barangay-talaga-elected-and-appointedparade-of-opening-salvo-n-snrsto-thomas-de-/3630665833752674/)  
> 44. Calatagan, Tagaytay, Philippines \- Reviews, Ratings, Tips and Why, [https://wanderlog.com/place/details/384519/calatagan](https://wanderlog.com/place/details/384519/calatagan)  
> 45. ANNEX \- FAS \- SGLG 2024 Simulation, [https://blgf.gov.ph/wp-content/uploads/2024/06/ANNEX-C-NTA-LDP-M.pdf](https://blgf.gov.ph/wp-content/uploads/2024/06/ANNEX-C-NTA-LDP-M.pdf)  
> 46. ANNEX A, [https://blgf.gov.ph/wp-content/uploads/2023/10/LIFT-report-compliance-in-timely-Submission\_Municipality-FY2022-Q4.pdf](https://blgf.gov.ph/wp-content/uploads/2023/10/LIFT-report-compliance-in-timely-Submission_Municipality-FY2022-Q4.pdf)  
> 47. list of compliant local government units on the, [https://blgf.gov.ph/wp-content/uploads/2019/04/List-of-Compliant-LGUs\_FY-2017.pdf](https://blgf.gov.ph/wp-content/uploads/2019/04/List-of-Compliant-LGUs_FY-2017.pdf)  
> 48. 2025 Batangas local elections \- Wikipedia, [https://en.wikipedia.org/wiki/2025\_Batangas\_local\_elections](https://en.wikipedia.org/wiki/2025_Batangas_local_elections)  
> 49. Coral Bleaching Detection Using PRISMA Hyperspectral Satellite, [https://philsa.gov.ph/research/coral-bleaching-detection-using-prisma-hyperspectral-satellite-imagery-in-calatagan-batangas/](https://philsa.gov.ph/research/coral-bleaching-detection-using-prisma-hyperspectral-satellite-imagery-in-calatagan-batangas/)  
> 50. Distribution of Epifaunal Macroinvertebrates in Seagrass Beds in, [https://philjournalsci.dost.gov.ph/distribution-of-epifaunal-macroinvertebrates-in-seagrass-beds-in-calatagan-batangas-the-philippines/](https://philjournalsci.dost.gov.ph/distribution-of-epifaunal-macroinvertebrates-in-seagrass-beds-in-calatagan-batangas-the-philippines/)  
> 51. Comprehensive Land Use Plan of Tanauan City: 2016- 2025, [https://archive.tanauancity.gov.ph/wp-content/uploads/2020/07/CLUP-2016-2025.pdf](https://archive.tanauancity.gov.ph/wp-content/uploads/2020/07/CLUP-2016-2025.pdf)  
> 52. The Second STATE OF THE COASTS of Bataan Province \- PEMSEA, [https://www.pemsea.org/sites/default/files/2024-07/Second%20Bataan%20SOC%202024.pdf](https://www.pemsea.org/sites/default/files/2024-07/Second%20Bataan%20SOC%202024.pdf)  
> 53. November 7, 2023 I Oath-Taking Congrats to our newly-elected, [https://www.facebook.com/mayorpeveligan/posts/november-7-2023-i-oath-taking-congrats-to-our-newly-elected-barangay-and-sk-offi/680121830911973/](https://www.facebook.com/mayorpeveligan/posts/november-7-2023-i-oath-taking-congrats-to-our-newly-elected-barangay-and-sk-offi/680121830911973/)  
> 54. Looc, Occidental Mindoro \- Grokipedia, [https://grokipedia.com/page/looc\_occidental\_mindoro](https://grokipedia.com/page/looc_occidental_mindoro)