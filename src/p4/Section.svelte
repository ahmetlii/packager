<script>
  export let caption = false;
  export let center = false;
  export let modal = false;
  export let accent = '';
</script>

<style>
  .card {
    max-width: 600px;
    margin: auto;
    border-radius: 0.3em;
    background-color: #fff;
    padding: 1em;
    margin-top: 1em;
    margin-bottom: 1em;
    box-shadow: 0 2px 0.5em 0.1em rgba(0, 0, 0, 0.2);
  }
  :global([theme="dark"]) .card {
    background: #222;
  }
  .caption {
    font-style: italic;
  }
  .modal {
    width: 100%;
    max-width: 400px;
    margin: 0 8px;
  }
  .center {
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
</style>

<div class="card" class:caption class:modal class:center={caption || center} style={accent ? `border-top: 6px solid ${accent}` : ''}>
  <slot></slot>
</div>
