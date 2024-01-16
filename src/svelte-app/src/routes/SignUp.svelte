<script>
  let signUpData = {
    username: "",
    password: "",
    confirmPassword: "",
    email: ""
  };

  async function signUp() {
    try {
      // 서버로 이메일 중복 확인 요청
      const checkEmailResponse = await fetch(
        `http://localhost:3000/api/auth/check-email?email=${encodeURIComponent(signUpData.email)}`
      );

      if (!checkEmailResponse.ok) {
        throw new Error("이메일 중복 확인에 실패했습니다.");
      }

      const { data: { emailExists } } = await checkEmailResponse.json();

      if (emailExists) {
        alert("이미 등록된 이메일 주소입니다. 다른 이메일을 사용해주세요.");
        return;
      }

      // 중복되지 않은 경우 회원가입 진행
      const signUpResponse = await fetch("http://localhost:3000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signUpData),
      });

      if (!signUpResponse.ok) {
        throw new Error("회원가입에 실패했습니다.");
      }

      const data = await signUpResponse.json();
      console.log("회원가입 성공:", data);
    } catch (error) {
      console.error(error);
      alert("회원가입 중 오류가 발생했습니다.");
    }
  }
</script>

<main>
  <h1>🎄 Sign Up 🎅</h1>

  <form on:submit="{signUp}">
    <label for="username">🎅 Username:</label>
    <input type="text" bind:value="{signUpData.username}" />

    <label for="password">🎁 Password:</label>
    <input type="password" bind:value="{signUpData.password}" />

    <label for="confirmPassword">🎁 Confirm Password:</label>
    <input type="password" bind:value="{signUpData.confirmPassword}" />

    <label for="email">📧 Email:</label>
    <input type="email" bind:value="{signUpData.email}" />

    <button type="submit">🎄 Sign Up</button>
  </form>
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
</style>
