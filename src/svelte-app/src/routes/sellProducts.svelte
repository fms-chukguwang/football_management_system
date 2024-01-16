<script>
    import { onMount } from 'svelte';
  
    let name = '';
    let description = '';
    let price = '';
    let userId = ''; 
  
    const createProduct = async () => {
      try {
        const response = await fetch('/api/products/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description,
            userId,
            price: parseInt(price), 
          }),
        });
  
        if (response.ok) {
          const createdProduct = await response.json();
          console.log('Product created:', createdProduct);
        } else {
          console.error('Failed to create product');
        }
      } catch (error) {
        console.error('Error creating product:', error);
      }
    };
  
  </script>
  
  <style>
  </style>
  
  <main>
    <h1>Create a Product</h1>
    <form on:submit|preventDefault={createProduct}>
      <label>
        Product Name:
        <input type="text" bind:value={name} />
      </label>
      <label>
        Description:
        <textarea bind:value={description}></textarea>
      </label>
      <label>
        Price:
        <input type="text" bind:value={price} />
      </label>
      <button type="submit">Create Product</button>
    </form>
  </main>
  