<script>
  import {onMount, tick} from 'svelte';
  import {writable} from 'svelte/store';
  import {_} from '../locales';
  import Section from './Section.svelte';
  import Button from './Button.svelte';
  import DropArea from './DropArea.svelte';
  import writablePersistentStore from './persistent-store';
  import {error, progress} from './stores';
  import {UserError} from './errors';
  import getProjectTitle from './get-project-meta';
  import loadProject from '../packager/load-project';
  import {extractProjectId, isValidURL, getTitleFromURL} from './url-utils';

  const hasProjectIdInURL = location.hash && /^#\d+$/.test(location.hash);
  const initialProjectId = hasProjectIdInURL ? location.hash.substring(1) : '60917032';

  let type;
  let projectId;
  if (hasProjectIdInURL) {
    type = writable('id');
    projectId = writable(initialProjectId);
    onMount(() => {
      load();
    });
  } else {
    type = writablePersistentStore('SelectProject.type', 'id');
    projectId = writablePersistentStore('SelectProject.id', initialProjectId);
  }
  const projectUrl = writablePersistentStore('SelectProject.url', '');

  let files = null;
  let fileInputElement;

  export let projectData = null;
  const reset = () => {
    projectData = null;
  };

  // Reset project whenever an input changes
  $: files, $projectId, $type, reset();

  const load = async () => {
    if ($progress.visible) {
      // Already running something
      return;
    }

    try {
      reset();
      $progress.visible = true;

      let uniqueId = '';
      let id = null;
      let projectTitle = '';
      let project;

      const progressCallback = (type, a, b) => {
        if (type === 'fetch') {
          $progress.progress = a;
        } else if (type === 'assets') {
          $progress.text = $_('progress.loadingAssets')
            .replace('{complete}', a)
            .replace('{total}', b);
          $progress.progress = a / b;
        } else if (type === 'compress') {
          $progress.text = $_('progress.compressingProject');
          $progress.progress = a;
        }
      };

      if ($type === 'id') {
        id = $projectId;
        if (!id) {
          throw new UserError($_('select.invalidId'));
        }
        uniqueId = `#${id}`;
        $progress.text = $_('progress.loadingProjectData');
        [projectTitle, project] = await Promise.all([
          getProjectTitle(id),
          loadProject.fromID(id, progressCallback)
        ]);
      } else if ($type === 'file') {
        if (!files) {
          throw new UserError($_('select.noFileSelected'));
        }
        const file = files[0];
        uniqueId = `@${file.name}`;
        projectTitle = file.name;
        $progress.text = $_('progress.compressingProject');
        project = await loadProject.fromFile(file, progressCallback);
      } else if ($type === 'url') {
        const url = $projectUrl;
        if (!isValidURL(url)) {
          throw new UserError($_('select.invalidUrl'));
        }
        uniqueId = `$${url}`;
        $progress.text = $_('progress.loadingProjectData');
        projectTitle = getTitleFromURL(url);
        project = await loadProject.fromURL(url, progressCallback);
      } else {
        throw new Error('Unknown type');
      }

      projectData = {
        projectId: id,
        uniqueId,
        title: projectTitle,
        project,
      };
    } catch (e) {
      $error = e;
    }

    progress.reset();
  };

  // just incase some non-number string was stored from older versions
  $projectId = extractProjectId($projectId);

  const getDisplayedProjectURL = () => `https://scratch.mit.edu/projects/${$projectId}`;

  const submitOnEnter = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
      load();
    }
  };
  const handleInput = (e) => {
    $projectId = extractProjectId(e.target.value);
    e.target.value = getDisplayedProjectURL();
  };
  const handleFocus = (e) => {
    e.target.select();
  };
  const handleDrop = ({detail: dataTransfer}) => {
    const name = dataTransfer.files[0].name;
    if (name.endsWith('.sb') || name.endsWith('.sb2') || name.endsWith('.sb3')) {
      $type = 'file';
      files = dataTransfer.files;
      fileInputElement.files = files;
    }
  };
</script>

<style>
  input[type="text"] {
    max-width: 300px;
    flex-grow: 1;
  }
  .option {
    min-height: 25px;
    display: flex;
    align-items: center;
  }
  input[type="text"], input[type="file"] {
    margin-left: 4px;
  }
</style>

<DropArea on:drop={handleDrop}>
  <Section accent="#4C97FF">
    <h2>{$_('select.select')}</h2>
    <p>{$_('select.selectHelp')}</p>
    <div class="option">
      <label>
        <input type="radio" bind:group={$type} value="id">
        {$_('select.id')}
      </label>
      {#if $type === "id"}
        <input type="text" value={getDisplayedProjectURL()} spellcheck="false" on:keypress={submitOnEnter} on:input={handleInput} on:focus={handleFocus}>
      {/if}
    </div>
    <div class="option">
      <label>
        <input type="radio" bind:group={$type} value="file">
        {$_('select.file')}
      </label>
      <input hidden={$type !== "file"} bind:files={files} bind:this={fileInputElement} type="file" accept=".sb,.sb2,.sb3">
    </div>
    <div class="option">
      <label>
        <input type="radio" bind:group={$type} value="url">
        {$_('select.url')}
      </label>
      {#if $type === "url"}
        <input type="text" bind:value={$projectUrl} spellcheck="false" placeholder="https://..." on:keypress={submitOnEnter}>
      {/if}
    </div>
    <p>
      <Button on:click={load} disabled={$progress.visible} text={$_('select.loadProject')} />
    </p>
  </Section>
</DropArea>

{#if !$progress.visible && !projectData}
  <Section caption>
    <p>{$_('select.loadToContinue')}</p>
  </Section>
{/if}
