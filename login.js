document.addEventListener("DOMContentLoaded", function () {
  const adminContainer = document.querySelector(".admin-container");
  const originalContent = adminContainer.innerHTML;

  adminContainer.innerHTML = `<div style="padding: 20px; text-align: center;"><h2>Loading Admin Panel...</h2></div>`;

  firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
      console.log("User logged in:", user.uid);
      const userRef = db.collection("user").doc(user.uid);
      try {
        const doc = await userRef.get();
        
        if (!doc.exists) {
          console.warn("User document missing:", user.uid);
          throw new Error("User not registered in Firestore.");
        }

        const userData = doc.data();
        console.log("User Data:", userData);

        if (!userData.admin) {
          console.warn("Access denied: User is not an admin");
          throw new Error("User is not an admin.");
        }

        console.log("Admin verified. Loading panel...");
        adminContainer.innerHTML = originalContent;
        attachSignOutListener();
        fetchEnquiries();

      } catch (error) {
        console.error("Admin verification failed:", error.message);
        await firebase.auth().signOut();
        window.location.href = "login.html";
      }
    } else {
      console.warn("No user logged in.");
      window.location.href = "login.html";
    }
  });

  function attachSignOutListener() {
    const signOutBtn = document.getElementById("signOutBtn");
    if (signOutBtn) {
      signOutBtn.addEventListener("click", async function () {
        await firebase.auth().signOut();
        window.location.href = "login.html";
      });
    }
  }

  function fetchEnquiries() {
    console.log("Fetching enquiries...");
    const tableBody = document.querySelector("#enquiriesTable tbody");

    db.collection("enquiries")
      .orderBy("timestamp", "desc")
      .onSnapshot(
        (snapshot) => {
          tableBody.innerHTML = "";
          if (snapshot.empty) {
            console.warn("No enquiries found.");
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No enquiries found.</td></tr>`;
            return;
          }

          const fragment = document.createDocumentFragment();
          snapshot.forEach((doc) => {
            const enquiry = doc.data();
            console.log("Enquiry Data:", enquiry);

            let timeStr = "N/A";
            if (enquiry.timestamp) {
              try {
                timeStr = enquiry.timestamp.toDate().toLocaleString();
              } catch (err) {
                console.error("Error formatting timestamp:", err);
              }
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${enquiry.studentName || "N/A"}</td>
              <td>${enquiry.classApplying || "N/A"}</td>
              <td>${enquiry.parentName || "N/A"}</td>
              <td>${enquiry.phone ? `<a href="tel:${enquiry.phone}" style="color:#007aff; text-decoration:none;">${enquiry.phone}</a>` : "N/A"}</td>
              <td>${timeStr}</td>
            `;
            fragment.appendChild(tr);
          });
          tableBody.appendChild(fragment);
        },
        (error) => {
          console.error("Error fetching enquiries:", error);
        }
      );
  }
});
