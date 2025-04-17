// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // -------------------------
  // Theory Courses (Existing)
  // -------------------------

  // Course 1: STS1009 – Introduction to Quantitative, Logical and Verbal Ability
  const course1 = await prisma.course.upsert({
    where: { code: "STS1009" },
    update: {},
    create: {
      code: "STS1009",
      name: "Introduction to Quantitative, Logical and Verbal Ability",
      semester: 2,
      degree: "ECE",
      slotCombos: {
        create: [
          { slotCode: "D2+TDD2", venue: "213", faculty: "Jayesh" },
          { slotCode: "E2+TEE2", venue: "213", faculty: "Jayesh" },
          { slotCode: "B1+TB1", venue: "213", faculty: "Jayesh" },
          { slotCode: "A2+TA2", venue: "213", faculty: "Jayesh" },
          { slotCode: "A1+TA1", venue: "213", faculty: "Prof.Mani" },
          { slotCode: "C1+TC1", venue: "213", faculty: "Prof.Mani" },
          { slotCode: "C2+TC2", venue: "213", faculty: "Prof.Mani" },
          { slotCode: "D1+TD1", venue: "404", faculty: "Prof.Mani" },
          { slotCode: "D2+TD2", venue: "314", faculty: "Prof.Mani" },
          { slotCode: "B2+TB2", venue: "213", faculty: "Prof.Mani" },
          { slotCode: "A2+TA2", venue: "309", faculty: "Mamatha" },
          { slotCode: "B1+TB1", venue: "309", faculty: "Mamatha" },
          { slotCode: "C1+TC1", venue: "314", faculty: "Mamatha" },
          { slotCode: "A1+TA1", venue: "309", faculty: "Mamatha" },
          { slotCode: "C2+TC2", venue: "309", faculty: "Mamatha" },
          { slotCode: "B2+TB2", venue: "309", faculty: "Prof.Thinesh" },
          { slotCode: "D1+TD1", venue: "309", faculty: "Prof.Thinesh" },
          { slotCode: "D2+TD2", venue: "415", faculty: "Prof.Thinesh" },
          { slotCode: "E2+TE2", venue: "309", faculty: "Prof.Thinesh" },
          { slotCode: "F1+TF1", venue: "309", faculty: "Prof.Thinesh" },
          { slotCode: "F2+TF2", venue: "309", faculty: "Prof.Thinesh" },
          { slotCode: "E1+TE1", venue: "G09", faculty: "Mamatha" },
          { slotCode: "A1+TA1", venue: "314", faculty: "Prof Hariharan" },
          { slotCode: "F1+TFF1", venue: "213", faculty: "Prof Hariharan" },
          { slotCode: "D1+TDD1", venue: "319", faculty: "Prof Hariharan" },
          { slotCode: "E1+TE1", venue: "309", faculty: "Prof Hariharan" },
          { slotCode: "F2+TFF2", venue: "213", faculty: "Prof Hariharan" },
          { slotCode: "E2+TE2", venue: "404", faculty: "Prof Hariharan" },
          { slotCode: "C1+TC1", venue: "319", faculty: "Prof Athithyan M" },
          { slotCode: "E1+TEE1", venue: "213", faculty: "Prof Athithyan M" },
          { slotCode: "A2+TA2", venue: "314", faculty: "Prof Athithyan M" },
          { slotCode: "C2+TC2", venue: "314", faculty: "Prof Athithyan M" },
          { slotCode: "G1+TG1", venue: "213", faculty: "Prof Athithyan M" },
          { slotCode: "A2+TA2", venue: "319", faculty: "Prof.Yamini Durga" },
          { slotCode: "G2+TG2", venue: "213", faculty: "Prof Athithyan M" },
          { slotCode: "B2+TB2", venue: "314", faculty: "Prof.Yamini Durga" },
          { slotCode: "B2+TB2", venue: "319", faculty: "Prof Poojitha L" },
          { slotCode: "E1+TEE1", venue: "319", faculty: "Prof.Vijay" },
          { slotCode: "F1+TF1", venue: "314", faculty: "Prof Poojitha L" },
          { slotCode: "F1+TFF1", venue: "319", faculty: "Prof.Vijay" },
          { slotCode: "F2+TF2", venue: "314", faculty: "Prof Poojitha L" },
          { slotCode: "C2+TC2", venue: "319", faculty: "Prof.Vijay" },
          { slotCode: "A1+TA1", venue: "319", faculty: "Prof.Vijay" },
          { slotCode: "D1+TD1", venue: "314", faculty: "Prof.Vijay" },
          { slotCode: "G2+TG2", venue: "319", faculty: "Prof.Vijay" },
          { slotCode: "B1+TB1", venue: "314", faculty: "Bharath Ganesh" },
          { slotCode: "E2+TEE2", venue: "319", faculty: "Bharath Ganesh" },
          { slotCode: "D2+TDD2", venue: "319", faculty: "Bharath Ganesh" },
          { slotCode: "E1+TE1", venue: "314", faculty: "Bharath Ganesh" },
          { slotCode: "D1+TDD1", venue: "213", faculty: "Bharath Ganesh" },
          { slotCode: "F1+TF1", venue: "404", faculty: "Bharath Ganesh" },
          { slotCode: "F2+TFF2", venue: "319", faculty: "Syed MD Ghayassuddin" },
          { slotCode: "B1+TB1", venue: "319", faculty: "Syed MD Ghayassuddin" },
          { slotCode: "C1+TC1", venue: "309", faculty: "Syed MD Ghayassuddin" },
          { slotCode: "E2+TE2", venue: "314", faculty: "Syed MD Ghayassuddin" },
          { slotCode: "D2+TD2", venue: "309", faculty: "Syed MD Ghayassuddin" },
          { slotCode: "G1+TG1", venue: "319", faculty: "Syed MD Ghayassuddin" },
        ]
      }
    },
  });
  console.log("Course 1 upserted:", course1.code);

  // Course 2: MAT1002 – Applications of differential and difference equations
  const course2 = await prisma.course.upsert({
    where: { code: "MAT1002" },
    update: {},
    create: {
      code: "MAT1002",
      name: "Applications of differential and difference equations",
      semester: 2,
      degree: "ECE",
      slotCombos: {
        create: [
          { slotCode: "A1+SA1+TA1", venue: "313", faculty: "DR. KOTTU DURGA PRASAD" },
          { slotCode: "C1+SC1+TC1", venue: "411", faculty: "Prof.Pratik Premadarshi Ray" },
          { slotCode: "A2+SA2+TA2", venue: "317", faculty: "DR. RAVI KUMAR BANDARU" },
          { slotCode: "A1+SA1+TA1", venue: "319", faculty: "Prof.Sinuvasan R" },
          { slotCode: "A2+SA2+TA2", venue: "410", faculty: "Prof.Sinuvasan R" },
          { slotCode: "C1+SC1+TC1", venue: "317", faculty: "Prof.Shalini Thakur" },
          { slotCode: "C1+SC1+TC1", venue: "313", faculty: "Prof.Lisna PC" },
          { slotCode: "F2+TF2+TFF2", venue: "317", faculty: "Prof.Lisna PC" },
          { slotCode: "C1+SC1+TC1", venue: "319", faculty: "Prof.Satyanaryana Badeti" },
          { slotCode: "F1+SF1+TF1", venue: "G11", faculty: "Prof.Pratik Premadarshi Ray" },
          { slotCode: "A1+SA1+TA1", venue: "410", faculty: "Prof.Varunkumar Merugu" },
          { slotCode: "A2+SA2+TA2", venue: "411", faculty: "Prof.Varunkumar Merugu" },
          { slotCode: "F1+SF1+TF1", venue: "133", faculty: "Prof.Soumen Kundu" },
          { slotCode: "C2+SC2+TC2", venue: "411", faculty: "Prof.Manoj Kumar Mishra" },
          { slotCode: "A1+SA1+TA1", venue: "318", faculty: "Prof.Ramesh A" },
          { slotCode: "A2+SA2+TA2", venue: "318", faculty: "Prof.Ramesh A" },
          { slotCode: "F2+SF2+TF2", venue: "G10", faculty: "DR. GOKULNATH M" },
          { slotCode: "C2+SC2+TC2", venue: "319", faculty: "DR. GOKULNATH M" },
          { slotCode: "A1+SA1+TA1", venue: "411", faculty: "Prof.K.Panduranga" },
          { slotCode: "A2+SA2+TA2", venue: "319", faculty: "Prof.K.Panduranga" },
          { slotCode: "E1+SE1+TE1", venue: "G11", faculty: "DR.VANACHARLA PUJITHA" },
          { slotCode: "E2+SE2+TE2", venue: "G02", faculty: "DR.VANACHARLA PUJITHA" },
          { slotCode: "F1+SF1+TF1", venue: "G10", faculty: "Dr Pradip Ramesh Patle" },
          { slotCode: "C1+SC1+TC1", venue: "318", faculty: "Dr Pradip Ramesh Patle" },
          { slotCode: "C2+SC2+TC2", venue: "410", faculty: "DR.PRASHANT PATEL" },
          { slotCode: "F2+SF2+TF2", venue: "G01", faculty: "DR.PRASHANT PATEL" },
          { slotCode: "E1+SE1+TE1", venue: "133", faculty: "DR. CHIRANJEEV KUMAR SHAHU" },
          { slotCode: "E2+SE2+TE2", venue: "G10", faculty: "DR. CHIRANJEEV KUMAR SHAHU" },
          { slotCode: "C2+SC2+TC2", venue: "317", faculty: "DR.NIMAI SARKAR" },
          { slotCode: "F2+SF2+TF2", venue: "G02", faculty: "DR.NIMAI SARKAR" },
          { slotCode: "C2+SC2+TC2", venue: "318", faculty: "Prof.Vemula Ramakrishna Reddy" },
          { slotCode: "E1+SE1+TE1", venue: "G10", faculty: "NARENDRA KUMAR" },
          { slotCode: "E1+TE1+TEE1", venue: "317", faculty: "DR. RAVI KUMAR BANDARU" },
          { slotCode: "F1+TF1+TFF1", venue: "318", faculty: "DR. PRAKASH S" },
          { slotCode: "E2+SE2+TE2", venue: "G01", faculty: "DR. RAVI KUMAR BANDARU" },
          { slotCode: "A2+SA2+TA2", venue: "G01", faculty: "DR.SAISTA TABSSUM" },
          { slotCode: "A1+SA1+TA1", venue: "317", faculty: "DR.SAISTA TABSSUM" },
          { slotCode: "E2+TE2+TEE2", venue: "317", faculty: "DR.ANKIT" },
          { slotCode: "F1+TF1+TFF1", venue: "317", faculty: "DR.SUBHASIS PANDA" },
          { slotCode: "F2+TF2+TFF2", venue: "318", faculty: "DR.SATYENDRA SINGH CHAUHAN" },
          { slotCode: "C1+SC1+TC1", venue: "410", faculty: "DR.SATYENDRA SINGH CHAUHAN" },
          { slotCode: "E1+TE1+TEE1", venue: "318", faculty: "SHAZIA SABIR" },
          { slotCode: "E2+TE2+TEE2", venue: "312", faculty: "SHAZIA SABIR" },
          { slotCode: "E2+TE2+TEE2", venue: "318", faculty: "DR. PRAKASH S" },
          { slotCode: "F1+TF1+TFF1", venue: "137", faculty: "RAMASAMY KAVIKUMAR" },
          { slotCode: "F2+TF2+TFF2", venue: "319", faculty: "RAMASAMY KAVIKUMAR" },
          { slotCode: "E1+TE1+TEE1", venue: "301", faculty: "DR. KOTTU DURGA PRASAD" },
          { slotCode: "C2+SC2+TC2", venue: "G01", faculty: "Prof.Soumen Kundu" },
        ]
      }
    },
  });
  console.log("Course 2 upserted:", course2.code);

  // Course 3: ENG2001 – English for Professional Communication
  const course3 = await prisma.course.upsert({
    where: { code: "ENG2001" },
    update: {},
    create: {
      code: "ENG2001",
      name: "English for Professional Communication",
      semester: 2,
      degree: "ECE",
      slotCombos: {
        create: [
          { slotCode: "B2", venue: "133", faculty: "V VISHNU" },
          { slotCode: "B2", venue: "134", faculty: "Prof.Ann Mary George" },
          { slotCode: "A1", venue: "137", faculty: "DR. NEETHU P ANTONY" },
          { slotCode: "B1", venue: "134", faculty: "Prof.Sudesh Manger" },
          { slotCode: "G1", venue: "G02", faculty: "Prof.Anupama A.P" },
          { slotCode: "D1", venue: "G01", faculty: "DR. ANJITHA GOPI" },
          { slotCode: "A2", venue: "219", faculty: "Prof.Aby Abraham" },
          { slotCode: "G2", venue: "137", faculty: "Prof.Anindita Shome" },
          { slotCode: "D2", venue: "138", faculty: "Prof.Arpana Venu" },
          { slotCode: "A1", venue: "138", faculty: "DR.SANZIOU BORO" },
          { slotCode: "B1", venue: "135", faculty: "Prof.Ann Mary George" },
          { slotCode: "G1", venue: "138", faculty: "Prof.Amar Wayal" },
          { slotCode: "D1", venue: "G02", faculty: "Prof.Deepjoy Katuwal" },
          { slotCode: "A2", venue: "220", faculty: "Prof.Y.Mary Chandini" },
          { slotCode: "G2", venue: "138", faculty: "Prof.Shubhra Ghoshal" },
          { slotCode: "D2", venue: "219", faculty: "SRIRUPA PODDAR" },
          { slotCode: "G2", venue: "219", faculty: "NEELIMA ADAPA" },
          { slotCode: "D1", venue: "138", faculty: "Prof.Raghavi R K" },
          { slotCode: "G2", venue: "220", faculty: "DR.PRAGNYA PARIMITA CHAYANI" },
          { slotCode: "B1", venue: "137", faculty: "RINI SINGH" },
        ]
      }
    },
  });
  console.log("Course 3 upserted:", course3.code);

  // Course 4: PHY1007 – Principles of Electronics
  const course4 = await prisma.course.upsert({
    where: { code: "PHY1007" },
    update: {},
    create: {
      code: "PHY1007",
      name: "Principles of Electronics",
      semester: 2,
      degree: "ECE",
      slotCombos: {
        create: [
          { slotCode: "C2+TC2", venue: "133", faculty: "Prof.Roopas Kiran Sirugudu" },
          { slotCode: "B1+TB1", venue: "323", faculty: "Prof.Nallamuthu S" },
          { slotCode: "E2+TEE2", venue: "135", faculty: "Prof.Nallamuthu S" },
          { slotCode: "D1+TD1", venue: "G11", faculty: "Prof.Roopas Kiran Sirugudu" },
          { slotCode: "D1+TD1", venue: "G10", faculty: "Prof.Madhusudhana Rao N" }
        ]
      }
    },
  });
  console.log("Course 4 upserted:", course4.code);

  // Course 5: ECE1003 – Digital Logic Design
  const course5 = await prisma.course.upsert({
    where: { code: "ECE1003" },
    update: {},
    create: {
      code: "ECE1003",
      name: "Digital Logic Design",
      semester: 2,
      degree: "ECE",
      slotCombos: {
        create: [
          { slotCode: "A1+TA1", venue: "219", faculty: "Prof.Venkata Rajasekhar Nuthakki" },
          { slotCode: "B1+TB1", venue: "416", faculty: "Prof.Suseela Vappangi" },
          { slotCode: "E1+TE1", venue: "414", faculty: "Prof.Neha Gupta" },
          { slotCode: "A2+TA2", venue: "324", faculty: "Prof.Neha Gupta" },
          { slotCode: "B2+TB2", venue: "324", faculty: "Prof.Venkata Rajasekhar Nuthakki" },
          { slotCode: "E2+TE2", venue: "324", faculty: "Prof.Sudha Ellison Mathe" },
          { slotCode: "A1+TA1", venue: "220", faculty: "Prof.Neha Gupta" },
          { slotCode: "B1+TB1", venue: "417", faculty: "Prof.Manish Kumar Singh" },
          { slotCode: "E1+TEE1", venue: "G02", faculty: "ZUBER BASHA SHAIK" },
          { slotCode: "A2+TA2", venue: "406", faculty: "Prof.Manish Kumar Singh" },
          { slotCode: "B2+TB2", venue: "406", faculty: "Prof.Anoop Kumar Mishra" },
          { slotCode: "E2+TEE2", venue: "137", faculty: "SANDEEP SARJERAO GODHADE" },
          { slotCode: "A1+TA1", venue: "301", faculty: "Prof.Rohit Lorenzo" },
          { slotCode: "B1+TB1", venue: "419", faculty: "Prof.Khairnar Vikas Vishnu" },
          { slotCode: "E1+TE1", venue: "415", faculty: "Prof.Sumesh E P" },
          { slotCode: "A2+TA2", venue: "409", faculty: "Prof.Khairnar Vikas Vishnu" },
          { slotCode: "B2+TB2", venue: "409", faculty: "Prof.Khairnar Vikas Vishnu" },
          { slotCode: "E2+TE2", venue: "415", faculty: "G D V SANTHOSH KUMAR" },
          { slotCode: "A1+TA1", venue: "320", faculty: "Prof.Sudha Ellison Mathe" },
          { slotCode: "B1+TB1", venue: "420", faculty: "G D V SANTHOSH KUMAR" },
          { slotCode: "E1+TEE1", venue: "138", faculty: "DAYANAND KALAPALA" },
          { slotCode: "A2+TA2", venue: "414", faculty: "Prof.Pradosh Ranjan Sahoo" },
          { slotCode: "B2+TB2", venue: "414", faculty: "KESANAPALLI AKSA RANI" },
          { slotCode: "E2+TEE2", venue: "138", faculty: "DARAM SRIKANTH" },
          { slotCode: "A1+TA1", venue: "323", faculty: "Prof.Pradosh Ranjan Sahoo" },
          { slotCode: "B1+TB1", venue: "421", faculty: "Prof.Abdul Kayom MD Khairuzzaman" },
          { slotCode: "E1+TE1", venue: "416", faculty: "NAGA RAJU BATHULA" },
          { slotCode: "A2+TA2", venue: "415", faculty: "Prof.Sumesh E P" },
          { slotCode: "B2+TB2", venue: "415", faculty: "Prof.Sumesh E P" },
          { slotCode: "E2+TE2", venue: "416", faculty: "MS SHREYA SHREE DAS" },
          { slotCode: "A1+TA1", venue: "324", faculty: "Prof.Atul Shankar Mani Tripathi" },
          { slotCode: "B1+TB1", venue: "G09", faculty: "Prof.Anoop Kumar Mishra" },
          { slotCode: "E1+TEE1", venue: "219", faculty: "S. VIJAYADHEESWAR REDDY" },
          { slotCode: "A2+TA2", venue: "406", faculty: "Prof.Manish Kumar Singh" },
          { slotCode: "B1+TB1", venue: "G20", faculty: "Prof.Atul Shankar Mani Tripathi" },
          { slotCode: "E1+TE1", venue: "417", faculty: "Prof.Suseela Vappangi" },
          { slotCode: "A2+TA2", venue: "417", faculty: "Prof.Atul Shankar Mani Tripathi" },
          { slotCode: "B2+TB2", venue: "417", faculty: "GANDHAM SAI SRAVANTHI" },
          { slotCode: "E2+TE2", venue: "417", faculty: "Prof.Anoop Kumar Mishra" },
          { slotCode: "A1+TA1", venue: "409", faculty: "Prof.Abdul Kayom MD Khairuzzaman" },
          { slotCode: "E2+TE2", venue: "419", faculty: "Prof.Abdul Kayom MD Khairuzzaman" },
          { slotCode: "E1+TEE1", venue: "220", faculty: "KOTESWARA RAO PONNURU" },
          { slotCode: "A2+TA2", venue: "419", faculty: "Prof.Suseela Vappangi" },
          { slotCode: "B2+TB2", venue: "419", faculty: "Prof.Pradosh Ranjan Sahoo" },
        ]
      }
    },
  });
  console.log("Course 5 upserted:", course5.code);

  // Course 6: CSE2005 – Object Oriented Programming using JAVA
  const course6 = await prisma.course.upsert({
    where: { code: "CSE2005" },
    update: {},
    create: {
      code: "CSE2005",
      name: "Object Oriented Programming using JAVA",
      semester: 2,
      degree: "ECE",
      slotCombos: {
        create: [
          { slotCode: "C1+TC1", venue: "323", faculty: "Prof.Deepasikha Mishra" },
          { slotCode: "D1+TD1", venue: "133", faculty: "Prof.Prabha Selvaraj" },
          { slotCode: "F1+TF1", venue: "301", faculty: "Prof.Deepasikha Mishra" },
          { slotCode: "C2+TC2", venue: "301", faculty: "Prof.Deepasikha Mishra" },
          { slotCode: "D2+TD2", venue: "G01", faculty: "SANAL KUMAR T S" },
          { slotCode: "F2+TF2", venue: "410", faculty: "LOGANATHAN PAVITHRA" },
          { slotCode: "C1+TC1", venue: "324", faculty: "Prof.Aravapalli Rama Satish" },
          { slotCode: "D1+TDD1", venue: "320", faculty: "PRAVEEN KUMAR NELAPATI" },
          { slotCode: "F1+TFF1", venue: "219", faculty: "MAHABOOBSUBHANI SHAIK CH" },
          { slotCode: "C2+TC2", venue: "320", faculty: "Prof.Aravapalli Rama Satish" },
          { slotCode: "D2+TDD2", venue: "220", faculty: "PRAVEEN KUMAR NELAPATI" },
          { slotCode: "F2+TFF2", venue: "220", faculty: "SHAIK MAHABOOB BASHA" },
          { slotCode: "C1+TC1", venue: "406", faculty: "DR LELLA KRANTHI" },
          { slotCode: "D1+TD1", venue: "134", faculty: "DR LELLA KRANTHI" },
          { slotCode: "F1+TF1", venue: "409", faculty: "LOGANATHAN PAVITHRA" },
          { slotCode: "C2+TC2", venue: "323", faculty: "DR LELLA KRANTHI" },
          { slotCode: "D2+TD2", venue: "G02", faculty: "LOGANATHAN PAVITHRA" },
          { slotCode: "F2+TF2", venue: "134", faculty: "Prof.Prabha Selvaraj" },
          { slotCode: "C1+TC1", venue: "409", faculty: "SANAL KUMAR T S" },
          { slotCode: "D1+TDD1", venue: "323", faculty: "MAHABOOBSUBHANI SHAIK CH" },
          { slotCode: "F1+TFF1", venue: "220", faculty: "Prof.SCOPE Dig Crs Faculty-3" },
          { slotCode: "C2+TC2", venue: "324", faculty: "Prof.Prabha Selvaraj" },
          { slotCode: "D2+TDD2", venue: "101", faculty: "Prof.SCOPE Dig Crs Faculty-5" },
          { slotCode: "F2+TFF2", venue: "320", faculty: "Prof.SCOPE Dig Crs Faculty-7" },
          { slotCode: "C1+TC1", venue: "414", faculty: "RAVI KUMAR POLURU" },
          { slotCode: "D1+TD1", venue: "135", faculty: "SANAL KUMAR T S" },
          { slotCode: "F1+TF1", venue: "414", faculty: "MONIKA.A" },
          { slotCode: "C2+TC2", venue: "406", faculty: "MONIKA.A" },
          { slotCode: "D2+TD2", venue: "G10", faculty: "RAVI KUMAR POLURU" },
          { slotCode: "F2+TF2", venue: "324", faculty: "MONIKA.A" },
          { slotCode: "C1+TC1", venue: "415", faculty: "PUJARI JEEVANA JYOTHI" },
          { slotCode: "D1+TDD1", venue: "324", faculty: "Prof.SCOPE Dig Crs Faculty-8" },
          { slotCode: "F1+TFF1", venue: "320", faculty: "PUJARI JEEVANA JYOTHI" },
          { slotCode: "C2+TC2", venue: "409", faculty: "RAVI KUMAR POLURU" },
          { slotCode: "D2+TDD2", venue: "320", faculty: "PUJARI JEEVANA JYOTHI" },
          { slotCode: "F2+TFF2", venue: "323", faculty: "Prof.SCOPE Dig Crs Faculty-6" },
          { slotCode: "C1+TC1", venue: "416", faculty: "SHAIK MAHABOOB BASHA" },
          { slotCode: "D1+TD1", venue: "137", faculty: "Prof.SCOPE Dig Crs Faculty-7" },
          { slotCode: "F1+TF1", venue: "415", faculty: "Prof.SCOPE Dig Crs Faculty-7" },
          { slotCode: "C2+TC2", venue: "414", faculty: "Prof.SCOPE Dig Crs Faculty-5" },
          { slotCode: "D2+TDD2", venue: "323", faculty: "Prof.SCOPE Dig Crs Faculty-9" },
          { slotCode: "F2+TFF2", venue: "301", faculty: "Prof.SCOPE Dig Crs Faculty-9" },
        ]
      }
    },
  });
  console.log("Course 6 upserted:", course6.code);

  // ---------------------
  // Lab Courses (New)
  // ---------------------

  // Course 7: ENG2001L – English for Professional CommunicationL
  const course7 = await prisma.course.upsert({
    where: { code: "ENG2001L" },
    update: {},
    create: {
      code: "ENG2001L",
      name: "English for Professional CommunicationL",
      semester: 2,
      degree: "ECE",
      slotCombos: {
        create: [
          { slotCode: "L39+L40", venue: "117", faculty: "Prof.V Balasingh" },
          { slotCode: "L16+L17", venue: "117", faculty: "Prof.Tannishta Das gupta" },
          { slotCode: "L57+L58", venue: "117", faculty: "Prof.Tannishta Das gupta" },
          { slotCode: "L2+L3", venue: "117", faculty: "DR.DEBOSMITA BISWAS" },
          { slotCode: "L4+L5", venue: "117", faculty: "Prof.Sudesh Manger" },
          { slotCode: "L10+L11", venue: "117", faculty: "FAROOQ AHMAD MIR" },
          { slotCode: "L20+L21", venue: "117", faculty: "Prof.Amar Wayal" },
          { slotCode: "L22+L23", venue: "117", faculty: "Prof.Aby Abraham" },
          { slotCode: "L26+L27", venue: "117", faculty: "DR. ANJITHA GOPI" },
          { slotCode: "L32+L33", venue: "117", faculty: "DR. NEETHU P ANTONY" },
          { slotCode: "L34+L35", venue: "117", faculty: "Prof.Arpana Venu" },
          { slotCode: "L37+L38", venue: "117", faculty: "Prof.Ann Mary George" },
          { slotCode: "L43+L44", venue: "117", faculty: "Prof.Amar Wayal" },
          { slotCode: "L45+L46", venue: "117", faculty: "Prof.Anupama A.P" },
          { slotCode: "L51+L52", venue: "117", faculty: "DR.PRAGNYA PARIMITA CHAYANI" },
          { slotCode: "L61+L62", venue: "117", faculty: "DR. LINET THOMAS" },
          { slotCode: "L41+L42", venue: "117", faculty: "Prof.Aby Abraham" },
          { slotCode: "L71+L72", venue: "117", faculty: "Prof.Y.Mary Chandini" },
          { slotCode: "L49+L50", venue: "117", faculty: "DR.SANZIOU BORO" },
          { slotCode: "L8+L9", venue: "117", faculty: "Prof.Raghavi R K" },
          { slotCode: "L67+L68", venue: "117", faculty: "Prof.Rasheda Parveen" },
          { slotCode: "L69+L70", venue: "117", faculty: "Prof.Anindita Shome" },
          { slotCode: "L55+L56", venue: "117", faculty: "Prof.Rakhi N K" }
        ]
      }
    },
  });
  console.log("Course 7 upserted:", course7.code);

  // Course 8: PHY1007L – Principles of ElectronicsL
  const course8 = await prisma.course.upsert({
    where: { code: "PHY1007L" },
    update: {},
    create: {
      code: "PHY1007L",
      name: "Principles of ElectronicsL",
      semester: 2,
      degree: "ECE",
      slotCombos: {
        create: [
          { slotCode: "L4+L5", venue: "224", faculty: "Prof.Nallamuthu S" },
          { slotCode: "L67+L68", venue: "120", faculty: "Prof.Khadheer Pasha SK" },
          { slotCode: "L34+L35", venue: "120", faculty: "Prof.Ganesh Kotagiri" },
          { slotCode: "L43+L44", venue: "120", faculty: "Prof.Manmadha Rao Banki" },
          { slotCode: "L37+L38", venue: "224", faculty: "Prof.Kingshuk Sarkar" },
          { slotCode: "L47+L48", venue: "120", faculty: "Prof.Nagarjuna Neella" }
        ]
      }
    },
  });
  console.log("Course 8 upserted:", course8.code);

  // Course 9: ECE1003L – Digital Logic DesignL
  const course9 = await prisma.course.upsert({
    where: { code: "ECE1003L" },
    update: {},
    create: {
      code: "ECE1003L",
      name: "Digital Logic DesignL",
      semester: 2,
      degree: "ECE",
      slotCombos: {
        create: [
          { slotCode: "L4+L5", venue: "201", faculty: "GANDHAM SAI SRAVANTHI" },
          { slotCode: "L8+L9", venue: "201", faculty: "MS.G.P.S. PRASHANTHI" },
          { slotCode: "L10+L11", venue: "201", faculty: "MS SHREYA SHREE DAS" },
          { slotCode: "L14+L15", venue: "201", faculty: "CHENGALVA SRIHARI" },
          { slotCode: "L16+L17", venue: "201", faculty: "MS SHREYA SHREE DAS" },
          { slotCode: "L20+L21", venue: "201", faculty: "SHAIK RAJAK BABU" },
          { slotCode: "L22+L23", venue: "201", faculty: "Prof.Suseela Vappangi" },
          { slotCode: "L26+L27", venue: "201", faculty: "SANDEEP SARJERAO GODHADE" },
          { slotCode: "L28+L29", venue: "201", faculty: "NUTHI RAJU" },
          { slotCode: "L37+L38", venue: "201", faculty: "Prof.SENSE Dig Crs Faculty-5" },
          { slotCode: "L39+L40", venue: "201", faculty: "MAHABOOB KHAN PATHAN" },
          { slotCode: "L41+L42", venue: "201", faculty: "NAGA RAJU BATHULA" },
          { slotCode: "L43+L44", venue: "201", faculty: "ZUBER BASHA SHAIK" },
          { slotCode: "L45+L46", venue: "201", faculty: "GANDHAM SAI SRAVANTHI" },
          { slotCode: "L47+L48", venue: "201", faculty: "SHAIK RAJAK BABU" },
          { slotCode: "L49+L50", venue: "201", faculty: "KOTESWARA RAO PONNURU" },
          { slotCode: "L51+L52", venue: "201", faculty: "NAGA RAJU BATHULA" },
          { slotCode: "L53+L54", venue: "201", faculty: "GALAM RAVI KUMAR" },
          { slotCode: "L55+L56", venue: "201", faculty: "Prof.Neha Gupta" },
          { slotCode: "L57+L58", venue: "201", faculty: "MS.G.P.S. PRASHANTHI" },
          { slotCode: "L59+L60", venue: "201", faculty: "SHAIK LAL JOHN BASHA" },
          { slotCode: "L61+L62", venue: "201", faculty: "Prof.Chandan Nayak" },
          { slotCode: "L63+L64", venue: "201", faculty: "SHAIK LAL JOHN BASHA" },
          { slotCode: "L65+L66", venue: "201", faculty: "SATHISH MOTHE" },
          { slotCode: "L2+L3", venue: "311", faculty: "Prof.SENSE Dig Crs Faculty-5" },
          { slotCode: "L4+L5", venue: "311", faculty: "DARAM SRIKANTH" },
          { slotCode: "L8+L9", venue: "311", faculty: "KESANAPALLI AKSA RANI" },
          { slotCode: "L10+L11", venue: "311", faculty: "DARAM SRIKANTH" },
          { slotCode: "L14+L15", venue: "311", faculty: "KESANAPALLI AKSA RANI" },
          { slotCode: "L16+L17", venue: "311", faculty: "D HEPZIBHA RANI" },
          { slotCode: "L20+L21", venue: "311", faculty: "CHENGALVA SRIHARI" },
          { slotCode: "L22+L23", venue: "409", faculty: "S. VIJAYADHEESWAR REDDY" },
          { slotCode: "L26+L27", venue: "311", faculty: "D HEPZIBHA RANI" },
          { slotCode: "L28+L29", venue: "311", faculty: "Prof.Manish Kumar Singh" },
          { slotCode: "L37+L38", venue: "409", faculty: "ZUBER BASHA SHAIK" },
          { slotCode: "L39+L40", venue: "409", faculty: "S. VIJAYADHEESWAR REDDY" },
          { slotCode: "L41+L42", venue: "311", faculty: "SATHISH MOTHE" },
          { slotCode: "L43+L44", venue: "409", faculty: "MOHIT KUMAR" },
          { slotCode: "L45+L46", venue: "409", faculty: "KOTESWARA RAO PONNURU" },
          { slotCode: "L47+L48", venue: "311", faculty: "GALAM RAVI KUMAR" },
          { slotCode: "L49+L50", venue: "G03", faculty: "Prof.Anoop Kumar Mishra" },
          { slotCode: "L51+L52", venue: "409", faculty: "D HEPZIBHA RANI" },
          { slotCode: "L53+L54", venue: "311", faculty: "MAHABOOB KHAN PATHAN" },
          { slotCode: "L55+L56", venue: "409", faculty: "SHAIK RAJAK BABU" },
          { slotCode: "L57+L58", venue: "409", faculty: "MAHABOOB KHAN PATHAN" },
          { slotCode: "L59+L60", venue: "311", faculty: "THOTAPALLI VINAYAKUMAR" },
          { slotCode: "L61+L62", venue: "409", faculty: "Prof.Atul Shankar Mani Tripathi" },
          { slotCode: "L63+L64", venue: "409", faculty: "MAHABOOB KHAN PATHAN" },
          { slotCode: "L65+L66", venue: "311", faculty: "THOTAPALLI VINAYAKUMAR" },
          { slotCode: "L32+L33", venue: "311", faculty: "SHAIK RAJAK BABU" },
          { slotCode: "L34+L35", venue: "311", faculty: "MOHIT KUMAR" },
          { slotCode: "L67+L68", venue: "409", faculty: "Prof.Chandan Nayak" },
          { slotCode: "L69+L70", venue: "311", faculty: "SHAIK LAL JOHN BASHA" },
          { slotCode: "L2+L3", venue: "201", faculty: "SANDEEP SARJERAO GODHADE" }
        ]
      }
    },
  });
  console.log("Course 9 upserted:", course9.code);

  // Course 10: CSE2005L – Object Oriented Programming using JAVAL
  const course10 = await prisma.course.upsert({
    where: { code: "CSE2005L" },
    update: {},
    create: {
      code: "CSE2005L",
      name: "Object Oriented Programming using JAVAL",
      semester: 2,
      degree: "ECE",
      slotCombos: {
        create: [
          { slotCode: "L8+L9", venue: "119", faculty: "Prof.Deepasikha Mishra" },
          { slotCode: "L14+L15", venue: "119", faculty: "R PRASANNA KUMARI" },
          { slotCode: "L43+L44", venue: "119", faculty: "Prof.Prabha Selvaraj" },
          { slotCode: "L49+L50", venue: "119", faculty: "Prof.SCOPE Dig Crs Faculty-3" },
          { slotCode: "L8+L9", venue: "303", faculty: "LOGANATHAN PAVITHRA" },
          { slotCode: "L10+L11", venue: "119", faculty: "SHAIK MAHABOOB BASHA" },
          { slotCode: "L14+L15", venue: "303", faculty: "Prof.SCOPE Dig Crs Faculty-9" },
          { slotCode: "L16+L17", venue: "119", faculty: "Prof.Prabha Selvaraj" },
          { slotCode: "L20+L21", venue: "119", faculty: "MONIKA.A" },
          { slotCode: "L22+L23", venue: "119", faculty: "Prof.SCOPE Dig Crs Faculty-8" },
          { slotCode: "L26+L27", venue: "119", faculty: "Prof.Prabha Selvaraj" },
          { slotCode: "L28+L29", venue: "119", faculty: "Prof.Deepasikha Mishra" },
          { slotCode: "L32+L33", venue: "119", faculty: "SHAIK MAHABOOB BASHA" },
          { slotCode: "L34+L35", venue: "119", faculty: "Prof.SCOPE Dig Crs Faculty-5" },
          { slotCode: "L43+L44", venue: "303", faculty: "Prof.Deepasikha Mishra" },
          { slotCode: "L45+L46", venue: "119", faculty: "Prof.Aravapalli Rama Satish" },
          { slotCode: "L47+L48", venue: "119", faculty: "SAPTHAGIRI MIRIYALA" },
          { slotCode: "L49+L50", venue: "303", faculty: "PRAVEEN KUMAR NELAPATI" },
          { slotCode: "L51+L52", venue: "G04", faculty: "LOGANATHAN PAVITHRA" },
          { slotCode: "L53+L54", venue: "119", faculty: "SANAL KUMAR T S" },
          { slotCode: "L55+L56", venue: "119", faculty: "Prof.SCOPE Dig Crs Faculty-7" },
          { slotCode: "L57+L58", venue: "119", faculty: "Prof.Aravapalli Rama Satish" },
          { slotCode: "L59+L60", venue: "119", faculty: "Prof.SCOPE Dig Crs Faculty-3" },
          { slotCode: "L61+L62", venue: "119", faculty: "PUJARI JEEVANA JYOTHI" },
          { slotCode: "L63+L64", venue: "119", faculty: "Prof.SCOPE Dig Crs Faculty-10" },
          { slotCode: "L65+L66", venue: "303", faculty: "PRAVEEN KUMAR NELAPATI" },
          { slotCode: "L67+L68", venue: "119", faculty: "Prof.SCOPE Dig Crs Faculty-6" },
          { slotCode: "L69+L70", venue: "119", faculty: "PUJARI JEEVANA JYOTHI" },
          { slotCode: "L71+L72", venue: "304", faculty: "Prof.SCOPE Dig Crs Faculty-9" },
          { slotCode: "L8+L9", venue: "304", faculty: "DR LELLA KRANTHI" },
          { slotCode: "L10+L11", venue: "303", faculty: "SANAL KUMAR T S" },
          { slotCode: "L14+L15", venue: "304", faculty: "RAVI KUMAR POLURU" },
          { slotCode: "L16+L17", venue: "303", faculty: "Prof.SCOPE Dig Crs Faculty-5" },
          { slotCode: "L20+L21", venue: "303", faculty: "R PRASANNA KUMARI" },
          { slotCode: "L22+L23", venue: "303", faculty: "RAVI KUMAR POLURU" },
          { slotCode: "L26+L27", venue: "303", faculty: "MONIKA.A" },
          { slotCode: "L28+L29", venue: "303", faculty: "LOGANATHAN PAVITHRA" },
          { slotCode: "L32+L33", venue: "303", faculty: "PADMAVATHI LAMBU" },
          { slotCode: "L34+L35", venue: "303", faculty: "Prof.SCOPE Dig Crs Faculty-9" },
          { slotCode: "L43+L44", venue: "304", faculty: "DR LELLA KRANTHI" },
          { slotCode: "L45+L46", venue: "G04", faculty: "SANAL KUMAR T S" },
          { slotCode: "L47+L48", venue: "303", faculty: "RAVI KUMAR POLURU" },
          { slotCode: "L49+L50", venue: "304", faculty: "PUJARI JEEVANA JYOTHI" },
          { slotCode: "L51+L52", venue: "304", faculty: "MAHABOOBSUBHANI SHAIK CH" },
          { slotCode: "L53+L54", venue: "303", faculty: "Prof.SCOPE Dig Crs Faculty-10" },
          { slotCode: "L55+L56", venue: "G04", faculty: "Prof.SCOPE Dig Crs Faculty-6" },
          { slotCode: "L57+L58", venue: "303", faculty: "DR LELLA KRANTHI" },
          { slotCode: "L59+L60", venue: "303", faculty: "Prof.SCOPE Dig Crs Faculty-8" },
          { slotCode: "L61+L62", venue: "G04", faculty: "MAHABOOBSUBHANI SHAIK CH" },
          { slotCode: "L63+L64", venue: "304", faculty: "MONIKA.A" },
          { slotCode: "L65+L66", venue: "119", faculty: "Prof.SCOPE Dig Crs Faculty-7" },
          { slotCode: "L67+L68", venue: "303", faculty: "Prof.Prabha Selvaraj" },
          { slotCode: "L69+L70", venue: "303", faculty: "Prof.SCOPE Dig Crs Faculty-3" },
          { slotCode: "L71+L72", venue: "201", faculty: "Prof.SCOPE Dig Crs Faculty-11" },
          { slotCode: "L71+L72", venue: "119", faculty: "Prof.SCOPE Dig Crs Faculty-12" }
        ]
      }
    },
  });
  console.log("Course 10 upserted:", course10.code);

}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
