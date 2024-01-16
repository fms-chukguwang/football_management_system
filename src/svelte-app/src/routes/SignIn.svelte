<script>
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';

  let signInData = {
    email: '',
    password: '',
  };
  let verificationCode = '';
  let sentVerificationCode = false;

  onMount(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const userData = await response.json();
      signInData.email = userData.email;
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  });

  const handleLogin = async () => {
    try {
      // Wait for the Kakao SDK script to be fully loaded
      await new Promise((resolve) => {
        if (window.Kakao) {
          resolve();
        } else {
          window.onload = resolve;
        }
      });

      // Now use Kakao SDK directly
      Kakao.init('3980c403de0926c15940e444945aef79');

      Kakao.Auth.authorize({
        redirectUri: "http://localhost:3000/api/auth/kakao/callback",
      });
    } catch (error) {
      console.error(error);
    }
  };

  async function signIn() {
    try {
      const response = await fetch("http://localhost:3000/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signInData),
        credentials: "include", // CORS 정책
      });

      const data = await response.json();

      if (response.ok) {
        // 로그인 성공 시 메인 페이지로 이동하면서 서버로부터 받은 쿠키를 저장
        document.cookie = `accessToken=${data.accessToken}; domain=localhost; path=/; secure;`;

        // 메인 페이지로 이동합니다.
        navigate("/");
      } else {
        console.error("Sign In Response:", data);
      }
    } catch (error) {
      console.error("Error signing in:", error);
    }
  }

  async function kakaoSignIn() {
    try {
      const response = await fetch("http://localhost:3000/api/auth/kakao", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // CORS 정책
      });

      const data = await response.json();

      if (response.ok) {
        // 로그인 성공 시 메인 페이지로 이동하면서 서버로부터 받은 쿠키를 저장
        document.cookie = `accessToken=${data.accessToken}; domain=localhost; path=/; secure;`;

        // 메인 페이지로 이동합니다.
        navigate("/");
      } else {
        console.error("Sign In Response:", data);
      }
    } catch (error) {
      console.error("Error signing in:", error);
    }
  }
  async function sendVerificationCode() {
    console.log('Verification code sent:', verificationCode);
    sentVerificationCode = true; 
  }

  async function confirmVerificationCode() {
    console.log('Verification code confirmed:', verificationCode);
  }
</script>

<main>
  <h1>🎄 Sign In 🎅</h1>
  <form on:submit|preventDefault={signIn}>
    <label for="email">🎅 Email:</label>
    <input type="text" bind:value="{signInData.email}" />

    <label for="password">🔒 Password:</label>
    <input type="password" bind:value="{signInData.password}" />

    <button type="submit">🎄 Sign In</button>
    <button on:click={handleLogin}>
      <img src="../../public/kakao_login_medium_narrow.png" alt="Kakao Login" />
    </button>
  </form>
  <div>
    <label for="verificationCode">Verification Code:</label>
    <input type="text" bind:value="{verificationCode}" />

    {#if !sentVerificationCode}
      <button on:click={sendVerificationCode}>Send Verification Code</button>
    {/if}
    
    {#if sentVerificationCode}
      <button on:click={confirmVerificationCode}>Confirm Verification Code</button>
    {/if}
  </div>
</main>

<style>
  main {
    text-align: center;
    margin: 2em;
  }

  h1 {
    font-size: 2em;
    margin-bottom: 20px;
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  label {
    margin-top: 10px;
    font-size: 1.2em;
  }

  input {
    margin-top: 5px;
    padding: 8px;
    font-size: 1em;
  }

  button {
    margin-top: 20px;
    padding: 10px;
    font-size: 1.2em;
    background-color: #e74c3c;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }

  button:hover {
    background-color: #c0392b;
  }

  button img {
    height: auto;
  }

  div {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  label {
    font-size: 1.2em;
  }

  input {
    margin-top: 5px;
    padding: 8px;
    font-size: 1em;
  }

  button {
    margin-top: 10px;
    padding: 8px;
    font-size: 1em;
    background-color: #3498db;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }

  button:hover {
    background-color: #2980b9;
  }
</style>