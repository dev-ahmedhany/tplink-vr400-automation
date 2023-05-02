import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import AreaChart from "@/components/StackedArea";
import getFirestore from "@/utils/getFirestoreAdmin";

const inter = Inter({ subsets: ["latin"] });

export default function Home({
  csvData,
  total
}: {
  csvData: string;
  total: number;
}) {

  return (
    <>
      <Head>
        <title>Tp link usage</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div className={styles.center}></div>
        <AreaChart csvData={csvData} />
        Total usage : {Math.round(total / 1024 / 1024 / 1024)}GB
      </main>
    </>
  );
}

export const getStaticProps = async () => {
  const db = getFirestore();
  const snapshot = await db.collection("usage").orderBy("startTime").get();
  if (snapshot.empty) {
    return { notFound: true };
  }

  let users = {} as { [key: string]: string };
  let csvData = "usage,";
  const totals = {} as { [key: string]: { usage: number; name: string } };

  snapshot.forEach((doc) => {
    const docData = doc.data();
    if (docData.data) {
      Object.keys(docData.data).forEach((key: any) => {
        if (!users[key] && docData.data[key].name) {
          users[key] = docData.data[key].name;
          totals[key] = { usage: 0, name: docData.data[key].name };
        }
      });
    }
  });

  const macList = Object.keys(users);

  snapshot.forEach((doc) => {
    const docData = doc.data();
    if (docData.data) {
      macList.forEach((mac: string) => {
        if (docData.data[mac]) {
          let usage = docData.data[mac].usage;
          const usageNum = Number(usage.slice(0, -1));
          if (usage.includes("K")) {
            usage = usageNum * 1024;
          } else if (usage.includes("M")) {
            usage = usageNum * 1024 * 1024;
          } else if (usage.includes("G")) {
            usage = usageNum * 1024 * 1024 * 1024;
          } else {
            usage = usage;
          }
          usage = Number(usage);
          totals[mac].usage += usage;
        }
      });
    }
  });

  const total = Object.keys(totals).reduce((acc, key) => {
    return acc + totals[key].usage;
  }, 0);

  macList.forEach((mac: string) => {
    const separator = users[mac].length < 10 ? "_".repeat(10-users[mac].length) : "";
    csvData += `${users[mac].slice(0, 10)}_${separator}_${Math.round(totals[mac].usage / 1024 / 1024 / 1024)}GB,`;
  });
  csvData = csvData.slice(0, -1);
  csvData += "\n";

  let startPoint = 0;

  snapshot.forEach((doc) => {
    const docData = doc.data();
    if (docData.data) {
      const diff =
        docData.endTime.toDate().getTime() -
        docData.startTime.toDate().getTime();
      const mid = docData.startTime.toDate().getTime() + diff / 2;
      if (startPoint === 0) {
        startPoint = Math.floor(mid / 1000 / 60 / 60) - 1;
      }
      csvData += Math.floor(mid / 1000 / 60 / 60) - startPoint + ",";
      macList.forEach((mac: string) => {
        if (docData.data[mac]) {
          let usage = docData.data[mac].usage;
          const usageNum = Number(usage.slice(0, -1));
          if (usage.includes("K")) {
            usage = usageNum * 1024;
          } else if (usage.includes("M")) {
            usage = usageNum * 1024 * 1024;
          } else if (usage.includes("G")) {
            usage = usageNum * 1024 * 1024 * 1024;
          } else {
            usage = usage;
          }
          usage = Number(usage);
          csvData += (Math.round((usage / 1024 / 1024) / (diff / 1000 / 60)) || 0) + ",";
        } else {
          csvData += "0,";
        }
      });
      csvData = csvData.slice(0, -1);
      csvData += "\n";
    }
  });

  return {
    props: {
      csvData,
      total
    },
    revalidate: 60 * 60, // 1 hour
  };
};
