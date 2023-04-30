
import * as functions from "firebase-functions";

import admin = require("firebase-admin")
admin.initializeApp();

const db = admin.firestore();

import scrapeWebsite from "./pptr";

exports.scrape = functions
    .runWith({
      timeoutSeconds: 80,
      memory: "512MB",
    })
    .region("europe-west1").firestore
    .document("/usage/{timestamp}")
    .onCreate(async (change, context) => {
      try {
        const data = await scrapeWebsite();
        await db
            .collection("usage")
            .doc(context.params.timestamp)
            .update({
              endTime: admin.firestore.FieldValue.serverTimestamp(),
              data,
            });
      } catch (err) {
        await db
            .collection("usage")
            .doc(context.params.timestamp)
            .delete();
        throw err;
      }
    });

exports.scrapingSchedule = functions.
    region("europe-west1").pubsub
    .schedule("0 * * * *")
    .timeZone("Africa/Cairo")
    .onRun(async () => {
      const time = (new Date()).getTime().toFixed(0);
      const lastDoc = await db.collection("usage").
          orderBy("endTime").limitToLast(1).get();
      let startTime = admin.firestore.FieldValue.serverTimestamp();
      if (!lastDoc.empty) {
        if (lastDoc.docs[0].data().endTime) {
          startTime = lastDoc.docs[0].data().endTime;
        }
      }

      await db
          .collection("usage")
          .doc(time)
          .create({
            startTime,
          });
      return null;
    });
