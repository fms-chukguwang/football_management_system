<script>
  import { Link, navigate } from "svelte-routing";

  async function Signout() {
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      console.log("Sign Out Response:", data);

   // 로그아웃 후에는 사용자를 로그인 페이지로 리다이렉트
   navigate("/signin");
  } catch (error) {
    console.error("Error signing out:", error);
  }
  }
</script>

<main>
    <p>Please sign in or sign up.</p>
    <nav>
      <Link to="/signin">Sign In</Link>
      <Link to="/signup">Sign Up</Link>
    </nav>
</main>
