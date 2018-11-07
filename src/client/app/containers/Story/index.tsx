import React, { PureComponent } from "react";
import { match } from "react-router-dom";

import { ErrorPage, LoadingPage, NotFound } from "app/containers";
import StoriesContext, { StoryInterface } from "app/context/StoriesContext";

import Story from "./Story";

interface StoryPageMatcherProps {
  match: match<{ id: string }>;
  StoriesContext: { stories: StoryInterface[] };
}

interface StoryPageMatcherState {
  cached: boolean;
  error: null | string;
  isContextReady: boolean;
  status: "loading" | "notFound" | "success" | "error";
  story: object | null;
}

export class StoryPageMatcher extends PureComponent<
  StoryPageMatcherProps,
  StoryPageMatcherState
> {
  state: StoryPageMatcherState = {
    cached: false,
    error: null,
    isContextReady: false,
    status: "loading",
    story: null
  };

  fetchStory = async () => {
    const { stories } = this.props.StoriesContext;

    const filteredStory = stories.find(story =>
      story.link.includes(this.props.match.params.id)
    );

    if (filteredStory) {
      const cachedStory = localStorage.getItem(filteredStory.link);
      if (cachedStory) {
        this.setState({
          cached: true,
          status: "success",
          story: JSON.parse(cachedStory)
        });
        return;
      }
      try {
        const response = await fetch(`/medium-api?url=${filteredStory.link}`);
        const data = await response.json();

        this.setState({
          status: "success",
          story: data
        });
      } catch (error) {
        this.setState({
          error,
          status: "error"
        });
      }
    } else {
      this.setState({
        status: "notFound"
      });
    }
  };

  async componentDidMount() {
    if (
      this.props.StoriesContext.stories &&
      this.props.StoriesContext.stories.length > 0
    ) {
      await this.fetchStory();
    }
  }

  componentDidUpdate(prevProps: StoryPageMatcherProps) {
    if (
      !this.state.isContextReady &&
      prevProps.StoriesContext.stories.length === 0 &&
      this.props.StoriesContext.stories.length > 0
    ) {
      this.fetchStory();
    }
  }

  render() {
    const { cached, error, status, story } = this.state;
    switch (status) {
      case "loading":
        return <LoadingPage />;
      case "success":
        return <Story story={story} cached={cached} />;
      case "notFound":
        return <NotFound />;
      case "error":
        return <ErrorPage error={error} />;
    }
  }
}

export default StoriesContext.connect(StoryPageMatcher);
