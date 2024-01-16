<script>
	import { Router, Route, Link } from 'svelte-routing';
	import Home from './routes/Home.svelte';
	import SignIn from './routes/SignIn.svelte';
	import SignUp from './routes/SignUp.svelte';
  
	let loggedIn = false;
  
	$: userName = loggedIn ? 'User' : null;
  
	// Check if KakaoSDK is available
	if (typeof window !== 'undefined' && window.KakaoSDK) {
	  // Kakao SDK 초기화
	  window.KakaoSDK.init('3980c403de0926c15940e444945aef79');
	}  
  
	// 로그아웃 함수
	function signOut() {
	  // 서버에 로그아웃 요청을 보내 클라이언트의 상태 변경
	  loggedIn = false;
	}
  </script>
  
  <main>
	<Router>
	  <Route path="/" component={Home} />
	  <Route path="/signin" component={SignIn} />
	  <Route path="/signup" component={SignUp} />
  
	  <nav>
		<Link to="/">Home</Link>
		<Link to="/signin">Sign In</Link>
		<Link to="/signup">Sign Up</Link>
	  </nav>
	</Router>
  
	{#if loggedIn}
	  <h1>Hello {userName}!</h1>
	  <button on:click={signOut}>Sign Out</button>
	{:else}
	  <p>Please sign in or sign up.</p>
	{/if}
  </main>
  